"use client";

import { useState, useEffect } from "react";

import { remark } from "remark";
import gfm from "remark-gfm";
import html from "remark-html";

export default function Markdown({md}: {md: string}){
    const [htmlContent, setHtmlContent] = useState("");

    useEffect(() => {
        async function convert() {
            const file = await remark().use(html).use(gfm).process(md);
            setHtmlContent(String(file));
        }
        convert();
    }, [md]);

    return <div dangerouslySetInnerHTML={{__html: htmlContent}}/>;
}