import JSZip from "jszip";

export interface MergeDocxOptions {
    insertPageBreak?: boolean;
    trimEmptyParagraphs?: boolean;
}

/**
 * Merges multiple .docx files into a single .docx file blob cleanly.
 * Preserves document body XML, images/media, and relationship mappings.
 * Filters out extra empty paragraphs and duplicate page breaks.
 */
export async function mergeDocx(files: File[], options: MergeDocxOptions = {}): Promise<Blob> {
    const { insertPageBreak = true, trimEmptyParagraphs = true } = options;

    if (files.length === 0) {
        throw new Error("No files provided for merging.");
    }
    if (files.length === 1) {
        return files[0];
    }

    const parser = new DOMParser();
    const serializer = new XMLSerializer();

    // 1. Load the first document as base
    const baseBuffer = await files[0].arrayBuffer();
    const baseZip = await JSZip.loadAsync(baseBuffer);

    const baseDocXmlText = await baseZip.file("word/document.xml")?.async("string");
    if (!baseDocXmlText) {
        throw new Error(`File ${files[0].name} does not contain valid word/document.xml`);
    }

    const baseDoc = parser.parseFromString(baseDocXmlText, "application/xml");
    const baseBody = baseDoc.getElementsByTagName("w:body")[0];
    if (!baseBody) {
        throw new Error(`File ${files[0].name} has an invalid body tag`);
    }

    // Helper to check if an element is an empty paragraph
    const isEmptyParagraph = (el: Element): boolean => {
        const local = el.localName || el.nodeName.split(":").pop();
        if (local !== "p") return false;

        // If paragraph contains media, drawing, picture, or shape, it's NOT empty
        if (
            el.getElementsByTagName("w:drawing").length > 0 ||
            el.getElementsByTagName("w:pict").length > 0 ||
            el.getElementsByTagName("v:shape").length > 0 ||
            el.getElementsByTagName("drawing").length > 0 ||
            el.getElementsByTagName("pict").length > 0
        ) {
            return false;
        }

        const text = el.textContent || "";
        return text.trim() === "";
    };

    // Helper to check if an element contains a page break
    const hasPageBreak = (el: Element): boolean => {
        const brs = Array.from(el.getElementsByTagName("w:br")).concat(
            Array.from(el.getElementsByTagName("br"))
        );
        for (const br of brs) {
            const type = br.getAttribute("w:type") || br.getAttribute("type");
            if (type === "page") return true;
        }
        return false;
    };

    // Find trailing sectPr in baseBody
    let baseSectPr: Element | null = null;
    const bodyChildren = Array.from(baseBody.children);
    for (let i = bodyChildren.length - 1; i >= 0; i--) {
        const child = bodyChildren[i];
        const local = child.localName || child.nodeName.split(":").pop();
        if (local === "sectPr") {
            baseSectPr = child;
            continue;
        }
        if (trimEmptyParagraphs && isEmptyParagraph(child)) {
            baseBody.removeChild(child);
        } else {
            break; // Stop at first non-empty element
        }
    }

    // Load base relationships
    const baseRelsText = await baseZip.file("word/_rels/document.xml.rels")?.async("string");
    const baseRelsDoc = baseRelsText
        ? parser.parseFromString(baseRelsText, "application/xml")
        : parser.parseFromString(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
            "application/xml"
        );
    const baseRelsRoot = baseRelsDoc.getElementsByTagName("Relationships")[0] || baseRelsDoc.documentElement;

    // Track current highest rId
    let nextRIdNum = 1;
    const existingRelNodes = Array.from(baseRelsDoc.getElementsByTagName("Relationship"));
    existingRelNodes.forEach((rel) => {
        const id = rel.getAttribute("Id");
        if (id && id.startsWith("rId")) {
            const num = parseInt(id.replace("rId", ""), 10);
            if (!isNaN(num) && num >= nextRIdNum) {
                nextRIdNum = num + 1;
            }
        }
    });

    const createPageBreakNode = (): Element => {
        const p = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:p");
        const r = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:r");
        const br = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:br");
        br.setAttributeNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:type", "page");
        r.appendChild(br);
        p.appendChild(r);
        return p;
    };

    // Loop through subsequent documents
    for (let fileIdx = 1; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx];
        const buffer = await file.arrayBuffer();
        const zipN = await JSZip.loadAsync(buffer);

        const docXmlTextN = await zipN.file("word/document.xml")?.async("string");
        if (!docXmlTextN) continue;

        const docN = parser.parseFromString(docXmlTextN, "application/xml");
        const bodyN = docN.getElementsByTagName("w:body")[0];
        if (!bodyN) continue;

        // Process relationships
        const relsTextN = await zipN.file("word/_rels/document.xml.rels")?.async("string");
        const oldToNewRIdMap = new Map<string, string>();

        if (relsTextN) {
            const relsDocN = parser.parseFromString(relsTextN, "application/xml");
            const relNodesN = Array.from(relsDocN.getElementsByTagName("Relationship"));

            for (const relNode of relNodesN) {
                const oldId = relNode.getAttribute("Id");
                const type = relNode.getAttribute("Type");
                const target = relNode.getAttribute("Target");
                const targetMode = relNode.getAttribute("TargetMode");

                if (!oldId || !target) continue;

                const newRId = `rId${nextRIdNum++}`;
                oldToNewRIdMap.set(oldId, newRId);

                let newTarget = target;

                if (target.includes("media/") || target.startsWith("media")) {
                    const cleanTarget = target.startsWith("word/") ? target : `word/${target}`;
                    const mediaFile = zipN.file(cleanTarget);
                    if (mediaFile) {
                        const mediaData = await mediaFile.async("uint8array");
                        const filename = target.split("/").pop() || `image.png`;
                        const newFilename = `doc${fileIdx}_${filename}`;
                        newTarget = `media/${newFilename}`;
                        baseZip.file(`word/media/${newFilename}`, mediaData);
                    }
                } else if (targetMode !== "External" && !target.startsWith("http")) {
                    const cleanTarget = target.startsWith("word/") ? target : `word/${target}`;
                    const targetFile = zipN.file(cleanTarget);
                    if (targetFile) {
                        const targetData = await targetFile.async("uint8array");
                        const filename = target.split("/").pop() || `part.xml`;
                        const newFilename = `doc${fileIdx}_${filename}`;
                        newTarget = newFilename;
                        baseZip.file(`word/${newFilename}`, targetData);
                    }
                }

                const newRel = baseRelsDoc.createElementNS(
                    "http://schemas.openxmlformats.org/package/2006/relationships",
                    "Relationship"
                );
                newRel.setAttribute("Id", newRId);
                if (type) newRel.setAttribute("Type", type);
                newRel.setAttribute("Target", newTarget);
                if (targetMode) newRel.setAttribute("TargetMode", targetMode);
                baseRelsRoot.appendChild(newRel);
            }
        }

        // Remap relationship IDs in docN
        if (oldToNewRIdMap.size > 0) {
            const allElements = docN.getElementsByTagName("*");
            for (let j = 0; j < allElements.length; j++) {
                const el = allElements[j];
                for (let k = 0; k < el.attributes.length; k++) {
                    const attr = el.attributes[k];
                    if (oldToNewRIdMap.has(attr.value)) {
                        el.setAttribute(attr.name, oldToNewRIdMap.get(attr.value)!);
                    }
                }
            }
        }

        // Extract children of bodyN (excluding root sectPr)
        let childrenN = Array.from(bodyN.children).filter((child) => {
            const local = child.localName || child.nodeName.split(":").pop();
            return local !== "sectPr";
        });

        // Trim leading & trailing empty paragraphs from docN if enabled
        if (trimEmptyParagraphs) {
            while (childrenN.length > 0 && isEmptyParagraph(childrenN[0])) {
                childrenN.shift();
            }
            while (childrenN.length > 0 && isEmptyParagraph(childrenN[childrenN.length - 1])) {
                childrenN.pop();
            }
        }

        if (childrenN.length === 0) continue;

        // Check if a page break should be inserted
        if (insertPageBreak) {
            const lastChildInBase = baseSectPr
                ? baseSectPr.previousElementSibling
                : baseBody.lastElementChild;
            const alreadyHasBreak =
                (lastChildInBase ? hasPageBreak(lastChildInBase) : false) ||
                hasPageBreak(childrenN[0]);

            if (!alreadyHasBreak) {
                const pageBreak = createPageBreakNode();
                if (baseSectPr) {
                    baseBody.insertBefore(pageBreak, baseSectPr);
                } else {
                    baseBody.appendChild(pageBreak);
                }
            }
        }

        // Append non-sectPr children into baseBody
        for (const child of childrenN) {
            const importedChild = baseDoc.importNode(child, true);
            if (baseSectPr) {
                baseBody.insertBefore(importedChild, baseSectPr);
            } else {
                baseBody.appendChild(importedChild);
            }
        }
    }

    // Write updated XMLs back to baseZip
    baseZip.file("word/document.xml", serializer.serializeToString(baseDoc));
    baseZip.file("word/_rels/document.xml.rels", serializer.serializeToString(baseRelsDoc));

    return await baseZip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
}
