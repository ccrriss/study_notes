import { remark } from "remark";
import gfm from "remark-gfm";
import html from "remark-html";

export default async function Markdown({md}: {md: string}){
    const file = await remark().use(html).use(gfm).process(md);
    return <div dangerouslySetInnerHTML={{__html: String(file)}}/>;
}