"use client";

import { useState, useRef } from "react";
import MarkdownClient from "./MarkdownClient";
import { useEffect } from "react";

// 识别list marker
const reTask = /^(\s*)([-*+])\s+\[( |x|X)\]\s+/;
const reUList = /^(\s*)([-*+])\s+/;
const reOList = /^(\s*)(\d+)([.)])\s+/;

export default function MarkdownEditor({
    value,
    onChange
}: {
    value: string,
    onChange: (v: string) => void
}) {
    interface HistoryItem {
        value: string;
        selectionStart: number;
        selectionEnd: number;
    }

    const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const historyRef = useRef<HistoryItem[]>([]);
    const historyIndexRef = useRef(0);          
    const lastHistoryTimeRef = useRef(0); 


    useEffect(() => {
        historyRef.current = [{
            value,
            selectionStart: 0,
            selectionEnd: 0
        }];
        historyIndexRef.current = 0;
    }, []);

    

    function applyFormat(before: string, after: string = "") {
        const textarea = textareaRef.current;
        if(!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end);

        const newValue = 
            value.slice(0, start) +
            before + 
            selected +
            after + 
            value.slice(end);

        pushHistory(newValue, true);
        onChange(newValue);

        //自动设置光标位置
        setTimeout(() => {
            textarea.focus();
            if(selected.length === 0) {
                textarea.selectionStart = textarea.selectionEnd = start + before.length;
            } else {
                textarea.selectionStart = start + before.length;
                textarea.selectionEnd = end + before.length;
            }
        }, 0);       
    }

    function pushHistory(
        newValue: string, 
        force = false,
        selection?: {start: number; end: number}
    ) {
        const textarea = textareaRef.current;
        if(!textarea) return;
        
        const now = Date.now();
        const history = historyRef.current;
        const idx = historyIndexRef.current;

        const item: HistoryItem = {
            value: newValue,
            selectionStart: selection?.start??textarea.selectionStart,
            selectionEnd: selection?.end??textarea.selectionEnd,
        };

        // 防止连续相同内容
        if (history[idx]?.value === newValue) {
            history[idx].selectionStart = item.selectionStart;
            history[idx].selectionEnd = item.selectionEnd;
            return;
        }
        // force == true: 工具栏或tab/enter之类的操作
        if (
            force || 
            now - lastHistoryTimeRef.current > 500
        ) {
            history.splice(idx + 1);
            history.push(item);
            historyIndexRef.current = history.length - 1;            
        } else {
            // 合并到当前历史
            history[idx] = item;
        }

        lastHistoryTimeRef.current = now;
    }

    function syncSelectionFromTextarea(ta: HTMLTextAreaElement) {
        const idx = historyIndexRef.current;
        const history = historyRef.current;
        if(!history[idx]) return;

        // 只更新当前项的selection(不增加history)
        history[idx].selectionStart = ta.selectionStart;
        history[idx].selectionEnd = ta.selectionEnd;
    }

    function countFencesBefore(s: string) {
        // 计算行首的 ```
        const re = /(^|\n)[ \t]*```/g;
        let c = 0;
        while(re.exec(s)) c++;
        return c;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        // 避免中文输入法候选阶段误触
        if((e as any).isComposing) return;

        const textarea = textareaRef.current;
        if(!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Enter自动延续列表
        if(e.key == "Enter" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {

            const ta = textareaRef.current;
            if(!ta) return;

            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            if(start !== end) return; //暂不处理选中区域的Enter

            const text = value;

            const lineStart = text.lastIndexOf("\n", start - 1) + 1;
            const lineEndIdx = text.indexOf("\n", start);
            const lineEnd = lineEndIdx === -1? text.length : lineEndIdx;
            const line = text.slice(lineStart, lineEnd);

            const prefix = text.slice(0, lineStart);
            const fenceCount = countFencesBefore(prefix);
            const inCodeBlock = fenceCount % 2 === 1; //前面只有1个```才算在codeblock里面

            // next line
            const nextLineStart = lineEndIdx === -1 ? -1 : lineEndIdx + 1;
            let nextLine = "";
            let nextLineEnd = -1;
            if(nextLineStart !== -1){
                nextLineEnd = text.indexOf("\n", nextLineStart);
                if(nextLineEnd === -1){
                    nextLineEnd = text.length;
                }
                nextLine = text.slice(nextLineStart, nextLineEnd);
            }

            // 跳出代码块，当前行空白+ 下一行是```结束fence
            if(inCodeBlock && /^\s*$/.test(line) && nextLineStart !== -1) {
                const mClose = nextLine.match(/^(\s*)```(\s*)$/);
                if (mClose) {
                    e.preventDefault();

                    // 删除当前空行+它后面的换行， 把closing fence提上来
                    let newValue = text.slice(0, lineStart) + text.slice(nextLineStart);

                    const closingLen = nextLine.length;
                    const closingStart = lineStart;
                    const closingEnd = closingStart + closingLen;

                    // 确保closing fence后面至少有一个换行，让光标能落到下一行
                    if(closingEnd >= newValue.length || newValue[closingEnd] !== "\n") {
                        newValue = 
                            newValue.slice(0, closingEnd) + "\n" + newValue.slice(closingEnd);
                    }

                    const cursor = closingEnd + 1;

                    pushHistory(newValue, true, {start: cursor, end: cursor});
                    onChange(newValue);

                    setTimeout(() => {
                        const ta = textareaRef.current;
                        if(!ta) return;
                        ta.selectionStart = ta.selectionEnd = cursor;
                    }, 0);

                    return;
                }
            }

            // 自动补齐closing fence, 在opening fence 行尾末按enter
            // 只在"这一行是opening fence且光标在行尾"时触发
            const mOpen = line.match(/^(\s*)```[^\n]*$/);
            if(mOpen && start === lineEnd && fenceCount % 2 === 0) {
                e.preventDefault();

                const indent = mOpen[1]; // 保留缩进
                const insert = "\n" + indent + "\n" + indent + "```";
                const newValue = text.slice(0, start) + insert + text.slice(start);

                // 光标落在中间那一行(indent后)

                const cursor = start + 1 + indent.length;

                pushHistory(newValue, true, {start: cursor, end: cursor});
                onChange(newValue);

                setTimeout(() => {
                    const ta = textareaRef.current;
                    if(!ta) return;
                    ta.selectionStart = ta.selectionEnd = cursor;
                }, 0);

                return
            }

            if (inCodeBlock) return;
            


            let m: RegExpMatchArray | null = null;
            let insert = "";
            let markerLen = 0;

            if((m = line.match(reTask))) {
                const indent = m[1];
                const bullet = m[2];
                markerLen = m[0].length;

                const rest = line.slice(markerLen); //  marker后面的正文
                const isEmptyItem = rest.trim() === "" && start === lineEnd; // 行尾空条目才退出
                if(isEmptyItem) {
                    e.preventDefault();
                    const newValue = 
                        text.slice(0, lineStart) +
                        indent + // 保留缩进, 或者改为""
                        text.slice(lineStart + markerLen); //去掉当前行marker
                    // 光标回退markerlen
                    const newPos = start - markerLen;
                    pushHistory(newValue, true, {start: newPos, end: newPos});
                    onChange(newValue);
                    setTimeout(() => {
                        const ta = textareaRef.current;
                        if(!ta) return;
                        ta.selectionStart = ta.selectionEnd = newPos;
                    }, 0);
                    return;
                }

                insert = "\n" + indent + bullet + " [ ] "; //task的格式
            } else if ((m = line.match(reOList))) {
                const indent = m[1];
                const num = parseInt(m[2], 10);
                const punc = m[3];
                markerLen = m[0].length;

                const rest = line.slice(markerLen);
                const isEmptyItem = rest.trim() === "" && start === lineEnd;
                if(isEmptyItem) {
                    e.preventDefault();
                    const newValue = 
                        text.slice(0, lineStart) +
                        indent + 
                        text.slice(lineStart + markerLen);
                    const newPos = start - markerLen;
                    pushHistory(newValue, true, {start: newPos, end: newPos});
                    onChange(newValue);
                    setTimeout(() => {
                        const ta = textareaRef.current;
                        if(!ta) return;
                        ta.selectionStart = ta.selectionEnd = newPos;
                    }, 0);
                    return;
                }

                insert = "\n" + indent + String(num + 1) + punc + " ";
            } else if ((m = line.match(reUList))) {
                const indent = m[1];
                const bullet = m[2];
                markerLen = m[0].length;

                const rest = line.slice(markerLen);
                const isEmptyItem = rest.trim() === "" && start === lineEnd;
                if(isEmptyItem) {
                    e.preventDefault();
                    const newValue =
                        text.slice(0, lineStart) +
                        indent +
                        text.slice(lineStart + markerLen);
                    const newPos = start - markerLen;
                    pushHistory(newValue, true, {start: newPos, end: newPos});
                    onChange(newValue);
                    setTimeout(() => {
                        const ta = textareaRef.current;
                        if(!ta) return;
                        ta.selectionStart = ta.selectionEnd = newPos;
                    }, 0);
                    return;
                }
                
                insert = "\n" + indent + bullet + " ";
            } else {
                return;
            }

            // 继续列表: 在光标处插入，会把后半行挤到下一行之后
            e.preventDefault();

            const newValue = text.slice(0, start) + insert + text.slice(start);
            const newPos = start + insert.length;

            pushHistory(newValue, true, {start: newPos, end: newPos});
            onChange(newValue);

            setTimeout(() => {
                const ta = textareaRef.current;
                if(!ta) return;
                ta.selectionStart = ta.selectionEnd = newPos;
            }, 0);

            return;
        }

        // ctrl + z / cmd + z
        if((e.ctrlKey || e.metaKey) && e.key === "z") {
            e.preventDefault();

            const idx = historyIndexRef.current;
            if(idx <= 0) return;

            historyIndexRef.current = idx - 1;
            const item = historyRef.current[historyIndexRef.current];

            onChange(item.value);

            setTimeout(() => {
                const textarea = textareaRef.current;
                if(!textarea) return;
                textarea.selectionStart = item.selectionStart;
                textarea.selectionEnd = item.selectionEnd;
            }, 0)
            return;
        }

        // ctrl+y / cmd+ shift + z
        if((e.ctrlKey || e.metaKey) && 
            (e.key === "y" || (e.shiftKey && e.key === "Z"))
        ) {
            e.preventDefault();

            const idx = historyIndexRef.current;
            if(idx >= historyRef.current.length - 1) return;

            historyIndexRef.current = idx + 1;
            const item = historyRef.current[historyIndexRef.current];
            onChange(item.value);

            setTimeout(() => {
                const textarea = textareaRef.current;
                if(!textarea) return;
                textarea.selectionStart = item.selectionStart;
                textarea.selectionEnd = item.selectionEnd;
            }, 0)
            return;
        }
        
        // Tab part
        if(e.key !== "Tab") return;

        e.preventDefault();

        const currentValue = value;
        const indent = "    ";
        const selectedText = currentValue.slice(start, end);

        // VS Code style for list item
        const curLineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
        const curLineEndIdx = currentValue.indexOf("\n", start);
        const curLineEnd = curLineEndIdx === -1? currentValue.length : curLineEndIdx;
        const curLine = currentValue.slice(curLineStart, curLineEnd);

        // 避开code Block part
        const prefix = currentValue.slice(0, curLineStart);
        const inCodeBlock = countFencesBefore(prefix) % 2 === 1;

        const isListLine = 
            !inCodeBlock && (reTask.test(curLine) || reUList.test(curLine) || reOList.test(curLine));

        // 仅对 单行或单行部分选中应用整行缩进，多行选中扔按原来的整块缩进逻辑
        const isSingleLineSelection = !selectedText.includes("\n");

        if(isListLine && isSingleLineSelection) {
            if(e.shiftKey) {
                // Shift + Tab 单行反缩进
                let removed = 0;
                let newLine = curLine;

                if(newLine.startsWith("\t")) {
                    removed = 1;
                    newLine = newLine.slice(1);
                } else {
                    const leadingSpaces = (newLine.match(/^ +/)?.[0].length) ?? 0;
                    removed = Math.min(leadingSpaces, indent.length);
                    newLine = newLine.slice(removed);
                }

                if(removed === 0) return; // 没有缩进的话直接不处理

                const newValue = 
                    currentValue.slice(0, curLineStart) + newLine + currentValue.slice(curLineEnd);

                pushHistory(newValue, true);
                onChange(newValue);

                setTimeout(() => {
                    const ta = textareaRef.current;
                    if(!ta) return;
                    ta.selectionStart = Math.max(curLineStart, start - removed);
                    ta.selectionEnd = Math.max(curLineStart, end - removed);
                }, 0);

                return;
            } else {
                // Tab 整行缩进, 如果是有序列表， marker变为1(子列表)
                let lineToIndent = curLine;

                // 仅对有序列表做3. -> 1.
                const m0 = curLine.match(reOList);
                if(m0) {
                    const punc = m0[3]; // '.' 或 ')'
                    // 保留原本行内缩进 m0[1], 只替换数字部分
                    lineToIndent = curLine.replace(reOList, `${m0[1]}1${punc} `);
                }
                const newValue = 
                    currentValue.slice(0, curLineStart) + indent + lineToIndent + currentValue.slice(curLineEnd);

                pushHistory(newValue, true);
                onChange(newValue);

                setTimeout(() => {
                    const ta = textareaRef.current;
                    if(!ta) return;
                    ta.selectionStart = start + indent.length;
                    ta.selectionEnd = end + indent.length;
                }, 0);

                return;
            }
        }


        // Shift+Tab 取消缩进
        if(e.shiftKey) {
            // 未选中取消当前行的缩进
            if(start === end) {
                const before = currentValue.lastIndexOf("\n", start - 1) + 1; //行首
                if(currentValue.startsWith(indent, before)) {
                    const newValue = 
                        currentValue.slice(0,before) +
                        currentValue.slice(before + indent.length);

                    pushHistory(newValue, true);
                    onChange(newValue);

                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start - indent.length;
                    });
                }
                return;
            }

            //处理多行
            const lineStart = currentValue.lastIndexOf("\n", start -1 ) + 1; //第一行行首
            const lineEndIndex = currentValue.indexOf("\n", end); //选中的后面的换行符
            const lineEnd = lineEndIndex === -1? currentValue.length : lineEndIndex;

            const before = currentValue.slice(0, lineStart);
            const block = currentValue.slice(lineStart, lineEnd);
            const after = currentValue.slice(lineEnd);

            const lines = block.split("\n");
            
            let removedFirst = 0;
            let removedTotal = 0;

            const newLines = lines.map((line, index) => {
                let removed = 0;

                if(line.startsWith(indent)) {
                    removed = indent.length;
                    line = line.slice(indent.length);
                } else if(line.startsWith("\t")) {
                    removed = 1;
                    line = line.slice(1);
                }

                if(index === 0) {
                    removedFirst = removed;
                }
                removedTotal += removed;
                return line;
            });

            const newBlock = newLines.join("\n");
            const newValue = before + newBlock + after;

            pushHistory(newValue, true);
            onChange(newValue);

            setTimeout(() => {
                const textarea = textareaRef.current;
                if(!textarea) return;

                // start如果一开始在第一行中间，那去掉首行缩进后也要往前挪
                const newStart = Math.max(lineStart, start - removedFirst);
                const newEnd = end - removedTotal;

                textarea.selectionStart = newStart;
                textarea.selectionEnd = newEnd;
            }, 0);

            return;
        }
        // tab缩进
        // 多行选择整体缩进
        if(selectedText.includes("\n")) {
            const lines = selectedText.split("\n").map(line => indent + line);
            const newText = 
                currentValue.slice(0,start) +
                lines.join("\n") + 
                currentValue.slice(end);

            pushHistory(newText, true);
            onChange(newText);

            setTimeout(() => {
                textarea.selectionStart = start + indent.length;
                textarea.selectionEnd = end + indent.length * lines.length;                      
            });
            return;
        }
        // 单行 在光标处插入缩进
        const newValue = 
            currentValue.slice(0, start) +
            indent +
            currentValue.slice(start);

        pushHistory(newValue, true);
        onChange(newValue);
        
        setTimeout(() => { 
            const textarea = textareaRef.current;
            if(!textarea) return;
            textarea.selectionStart = start + indent.length;
            textarea.selectionEnd =
                    end + indent.length;
        }, 0);             
    }
        
    return (
        <div className="w-full border rounded bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap border-b bg-gray-50 px-3 py-2 text-sm gap-2">
                <button type="button" className="btn" onClick={() => applyFormat("**", "**")}>
                    <b>B</b>
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("*", "*")}>
                    <i>I</i>
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("# ")}>
                    H1
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("## ")}>
                    H2
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("> ")}>
                    Quote
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("- ")}>
                    List
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("- [ ] ")}>
                    CheckBox
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("`", "`")}>
                    Inline
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("\n```\n", "\n```\n")}>
                    Code Block
                </button>
                <button type="button" className="btn" onClick={() => applyFormat("\n----\n")}>
                    Divider
                </button>

                {/*Mode Switch*/}
                <div className="ml-auto flex gap-2">
                    <button type="button" onClick={() => setMode("edit")}
                        className={`px-2 py-1 rounded ${mode === "edit"? "bg-black text-white":"hover:bg-gray-200"}`}
                    >
                        Edit
                    </button>
                    <button type="button" onClick={() => setMode("preview")}
                        className={`px-2 py-1 rounded ${mode === "preview"? "bg-black text-white":"hover:bg-gray-200"}`}
                    >
                        Preview
                    </button>
                    <button type="button" onClick={() => setMode("split")}
                        className={`px-2 py-1 rounded ${mode === "split"? "bg-black text-white":"hover:bg-gray-200"}`}
                    >
                        Split
                    </button>
                </div>
            </div>

            {/* Edit Only */}
            {mode === "edit" && (
                <textarea value={value} 
                    ref={textareaRef}
                    onChange={(e) => {
                        const textarea = e.currentTarget;
                        const v = e.target.value;

                        // 输入后将selectionstart/end改成输入后的光标
                        pushHistory(v, false, {start: textarea.selectionStart, end: textarea.selectionEnd});

                        onChange(v);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full h-96 p-3 outline-none resize-none font-mono"
 
                    onSelect={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                    onKeyUp={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                    onMouseUp={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                    onFocus={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                    >
                </textarea>
            )}
            {/*Preview Only */}
            {mode === "preview" && (
                <div className="p-4 prose max-w-none h-96 overflow-y-scroll">
                    <MarkdownClient md={value}></MarkdownClient>
                </div>
            )}
            {/*Split Mode */}
            {mode === "split" && (
                <div className="grid grid-cols-2 h-96">
                    {/*Left Editor*/}
                    <textarea value={value}
                        ref={textareaRef}
                        onChange={(e) => {
                            const v = e.target.value;
                            const textarea = e.target;
                           
                            // 输入后将selectionstart/end改成输入后的光标
                            pushHistory(v, false, {start: textarea.selectionStart, end: textarea.selectionEnd});

                            onChange(v);
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full p-3 border-r outline-none resize-none font-mono"

                        onSelect={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                        onKeyUp={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                        onMouseUp={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                        onFocus={(e) => {syncSelectionFromTextarea(e.currentTarget)}}
                    ></textarea>
                    {/*Right Priview */}
                    <div className="p-4 overflow-y-scroll prose max-w-none">
                        <MarkdownClient md={value}></MarkdownClient>
                    </div>
                </div>
            )}
        </div>
    )
}