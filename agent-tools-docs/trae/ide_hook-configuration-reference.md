# trae / ide_hook-configuration-reference

> Source: https://docs.trae.cn/ide_hook-configuration-reference
> Fetched: 2026-07-29 20:24:42

---

Hook 配置详解(()=>{"use strict";var e,t,r,a,n,o,c,f,i={},d={};function l(e){var t=d[e];if(void 0!==t)return t.exports;var r=d[e]={exports:{}};return i[e].call(r.exports,r,r.exports,l),r.exports}if(l.m=i,l.n=e=>{var t=e&&e.\_\_esModule?()=>e.default:()=>e;return l.d(t,{a:t}),t},t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.\_\_proto\_\_,l.t=function(r,a){if(1&a&&(r=this(r)),8&a||"object"==typeof r&&r&&(4&a&&r.\_\_esModule||16&a&&"function"==typeof r.then))return r;var n=Object.create(null);l.r(n);var o={};e=e||[null,t({}),t([]),t(t)];for(var c=2&a&&r;("object"==typeof c||"function"==typeof c)&&!~e.indexOf(c);c=t(c))Object.getOwnPropertyNames(c).forEach(e=>{o[e]=()=>r[e]});return o.default=()=>r,l.d(n,o),n},l.d=(e,t)=>{for(var r in t)l.o(t,r)&&!l.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},l.f={},l.e=e=>Promise.all(Object.keys(l.f).reduce((t,r)=>(l.f[r](e,t),t),[])),l.u=e=>"static/js/async/"+({3234:"$",3313:"rag-widget",7807:"page"}[e]||e)+"."+{1032:"073ab03092",1093:"bea355c233",1162:"a2a9bd66ae",1207:"3f46ff7cea",1593:"f31179547b",1684:"2206314498",1689:"58fa40011d",183:"262384895c",1904:"5352aaf52d",1951:"f96298c6ae",1982:"412f609917",2180:"0fc77cf40c",2217:"f1be737b30",2703:"81b4be462c",2881:"14da83890c",3051:"5b8c9d25df",3157:"0bfac25da0",3234:"585a3f9198",3313:"023f1758d4",3500:"4663638c8d",3546:"37c5bced1e",3655:"562dcf22c3",3762:"89704f37a4",3985:"18974aa871",4020:"6ce4fa5b90",4097:"e90f0f2e7e",4171:"c9c86f7365",4310:"85b9099685",4316:"8d538c6be5",4526:"4767866220",460:"2973c28996",4604:"38511a7a33",4852:"e0234af886",4939:"80da571abe",503:"65cfe70275",5048:"60c3f9ea43",5396:"0be21ebdbc",5448:"06a6aeb469",5976:"c185faf589",609:"f1c471c143",6244:"adfc21bbf4",6562:"66393eebe9",6812:"ec46ff09a1",6851:"23d437c033",7367:"419a6b4240",7415:"2ee686629d",7558:"cfb7484405",7661:"4fb258de13",7756:"25c2bba752",7807:"d38bc8c689",7985:"79d04a715f",8547:"b37216d61f",8567:"197996a954",8579:"6a2c97a2db",8658:"58c1b0b296",8662:"b6d9df9408",8796:"f14c9a434a",8850:"dec5910a00",8880:"f5169d0ffa",9024:"c8f7837d89",9150:"a11152606a",9285:"d3e815b975",958:"f2fe0d9984",9735:"583d7ab809",9790:"69b86c9e8a",9865:"b6fdd8a42a",9879:"5b0db3af4f",9922:"7b2c65e80a"}[e]+".js",l.miniCssF=e=>"static/css/async/"+({3313:"rag-widget",7807:"page"}[e]||e)+"."+{3313:"6b79098a88",7756:"ddb1faeff0",7807:"7da9e47967"}[e]+".css",l.g=(()=>{if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}})(),l.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r={},a="@topic/renderer:",l.l=function(e,t,n,o){if(r[e])r[e].push(t);else{if(void 0!==n)for(var c,f,i=document.getElementsByTagName("script"),d=0;d<i.length;d++){var u=i[d];if(u.getAttribute("src")==e||u.getAttribute("data-rspack")==a+n){c=u;break}}c||(f=!0,(c=document.createElement("script")).timeout=120,l.nc&&c.setAttribute("nonce",l.nc),c.setAttribute("data-rspack",a+n),c.src=e),r[e]=[t];var s=function(t,a){c.onerror=c.onload=null,clearTimeout(b);var n=r[e];if(delete r[e],c.parentNode&&c.parentNode.removeChild(c),n&&n.forEach(function(e){return e(a)}),t)return t(a)},b=setTimeout(s.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=s.bind(null,c.onerror),c.onload=s.bind(null,c.onload),f&&document.head.appendChild(c)}},l.r=e=>{"u">typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"\_\_esModule",{value:!0})},l.nmd=e=>(e.paths=[],e.children||(e.children=[]),e),n=[],l.O=(e,t,r,a)=>{if(!t){var o=1/0;for(d=0;d<n.length;d++){for(var[t,r,a]=n[d],c=!0,f=0;f<t.length;f++)(!1&a||o>=a)&&Object.keys(l.O).every(e=>l.O[e](t[f]))?t.splice(f--,1):(c=!1,a<o&&(o=a));if(c){n.splice(d--,1);var i=r();void 0!==i&&(e=i)}}return e}a=a||0;for(var d=n.length;d>0&&n[d-1][2]>a;d--)n[d]=n[d-1];n[d]=[t,r,a]},l.p="//lf-arcosite.bytecdn.com/obj/arcosites/topic-cdn-1/","u">typeof document){var u={6408:0};l.f.miniCss=function(e,t){u[e]?t.push(u[e]):0!==u[e]&&{3313:1,7756:1,7807:1}[e]&&t.push(u[e]=new Promise(function(t,r){var a=l.miniCssF(e),n=l.p+a;if(function(e,t){for(var r=document.getElementsByTagName("link"),a=0;a<r.length;a++)if((c=(o=r[a]).getAttribute("data-href")||o.getAttribute("href"))&&(c=c.split("?")[0]),"stylesheet"===o.rel&&(c===e||c===t))return o;var n=document.getElementsByTagName("style");for(a=0;a<n.length;a++){var o,c;if((c=(o=n[a]).getAttribute("data-href"))===e||c===t)return o}}(a,n))return t();!function(e,t,r,a,n){var o=document.createElement("link");o.rel="stylesheet",o.type="text/css",l.nc&&(o.nonce=l.nc),o.href=t,o.onerror=o.onload=function(r){if(o.onerror=o.onload=null,"load"===r.type)a();else{var c=r&&("load"===r.type?"missing":r.type),f=r&&r.target&&r.target.href||t,i=Error("Loading CSS chunk "+e+" failed.\\n("+f+")");i.code="CSS\_CHUNK\_LOAD\_FAILED",i.type=c,i.request=f,o.parentNode&&o.parentNode.removeChild(o),n(i)}},r?r.parentNode.insertBefore(o,r.nextSibling):document.head.appendChild(o)}(e,n,null,t,r)}).then(function(){u[e]=0},function(t){throw delete u[e],t}))}}o={6408:0},l.f.j=function(e,t){var r=l.o(o,e)?o[e]:void 0;if(0!==r)if(r)t.push(r[2]);else if(6408!=e){var a=new Promise((t,a)=>r=o[e]=[t,a]);t.push(r[2]=a);var n=l.p+l.u(e),c=Error();l.l(n,function(t){if(l.o(o,e)&&(0!==(r=o[e])&&(o[e]=void 0),r)){var a=t&&("load"===t.type?"missing":t.type),n=t&&t.target&&t.target.src;c.message="Loading chunk "+e+" failed.\n("+a+": "+n+")",c.name="ChunkLoadError",c.type=a,c.request=n,r[1](c)}},"chunk-"+e,e)}else o[e]=0},l.O.j=e=>0===o[e],c=(e,t)=>{var r,a,[n,c,f]=t,i=0;if(n.some(e=>0!==o[e])){for(r in c)l.o(c,r)&&(l.m[r]=c[r]);if(f)var d=f(l)}for(e&&e(t);i<n.length;i++)a=n[i],l.o(o,a)&&o[a]&&o[a][0](),o[a]=0;return l.O(d)},(f=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_||[]).forEach(c.bind(null,0)),f.push=c.bind(null,f.push.bind(f))})()
;(function(){
window.\_MODERNJS\_ROUTE\_MANIFEST = {"routeAssets":{"$":{"chunkIds":["6493","7756","7807","3234"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js","static/js/async/$.585a3f9198.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"main":{"chunkIds":["6408","6493","9783","9535","44","1889"],"assets":["static/js/lib-polyfill.378681f845.js","static/js/lib-react.27fe10ca75.js","static/js/lib-router.89b6789ef8.js","static/js/44.2384edeb97.js","static/js/main.29e80207a7.js","static/css/main.0a4ac522c6.css"],"referenceCssAssets":["static/css/main.0a4ac522c6.css"]},"page":{"chunkIds":["6493","7756","7807"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"rag-widget":{"chunkIds":["9150","3313"],"assets":["static/js/async/9150.a11152606a.js","static/js/async/rag-widget.023f1758d4.js","static/css/async/rag-widget.6b79098a88.css"],"referenceCssAssets":["static/css/async/rag-widget.6b79098a88.css"]}}};
})();
!function(n,t){if(n.LogAnalyticsObject=t,!n[t]){function c(){c.q.push(arguments)}c.q=c.q||[],n[t]=c}n[t].l=+new Date}(window,"collectEvent") 

[![TRAE](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png)

TRAE](https://www.trae.cn/)

[TRAE IDE](/ide_trae-overview)[TRAE Work](/work_what-is-trae-solo)[TRAE 插件](/plugin_what-is-trae-plugin)[TRAE CLI](/cli_what-is-trae-cli)[企业版](/ide_hook-configuration-reference)

AI 助手

TRAE 智能问答助手

你好，我是 TRAE 文档问答助手 🎉
你在阅读当前文档的过程中，无论对文档概念的解释，还是文档内容方面的疑问，都可以随时向我提问，我会全力为你解答

推荐问题

TRAE IDE 里最热门的 Skill 是哪些？

如何创建自定义智能体？

如何配置 Rules？

新对话

文档反馈

[TRAE 概览](/ide_trae-overview)

[重磅更新：TRAE Work 客户端上线](/ide_trae-solo-is-now-available)

入门

教程 & 最佳实践

最新动态

AI 编程核心

[对话](/ide_chat)

模型

上下文

智能体（Agent）

[技能（Skill）](/ide_skills)

[规则（Rule）](/ide_rules)

[记忆](/ide_memories)

[命令](/ide_slash-commands)

钩子（Hook）

[通过 Hook 实现自动化](/ide_automate-actions-with-hooks)

[Hook 配置详解](/ide_hook-configuration-reference)

[超级代码补全：CUE](/ide_cue)

权限与审批

[内置工作流：Plan、Spec 与 Goal](/ide_spec-and-plan-workflows)

[浏览器控制](/ide_browser-use)

代码质量

SOLO 模式

工具与插件

工作环境

IDE 设置

“速通” 权益

问题排查

[联系我们](/ide_contact-us)

相关协议

AI 编程核心/钩子（Hook）/Hook 配置详解

# Hook 配置详解

本文档介绍 TRAE IDE 中 Hook 的配置方式、执行环境、输入输出规范，以及各类事件的触发与处理机制。

## Hook 配置

### Hook 配置文件位置

TRAE 支持全局 Hook 和项目 Hook。两类配置文件在不同操作系统中的存储位置如下：

| **Hook 类型** | **操作系统** | **Hook 配置文件位置** | **作用范围** |
| --- | --- | --- | --- |
| 全局 Hook | macOS & Linux | `~/.trae-cn/hooks.json` | 对本机当前用户下的所有工作区生效。 |
| Windows | `%userprofile%/.trae-cn/hooks.json` |
| 项目 Hook | macOS & Linux | `$PROJECT_FOLDER/.trae/hooks.json`  若当前工作区包含多个项目，默认会在第一个项目中创建配置文件。 | 仅对当前项目或工作区生效。 |
| Windows |

同时，TRAE 支持读取 Claude Code 中的 Hook 配置，配置流程参考[导入 Claude Code 中的 Hook](/ide/automate-actions-with-hooks#4c6238cd)。Claude Code 同样支持全局与项目 Hook：

| **Hook 类型** | **操作系统** | **Hook 配置文件位置** | **作用范围** |
| --- | --- | --- | --- |
| 全局 Hook | macOS & Linux | `~/.claude/settings.json` | 对本机当前用户下的所有工作区生效。 |
| Windows | `%userprofile%/.claude/settings.json` |
| 项目 Hook | macOS & Linux | * `$PROJECT_FOLDER/.claude/settings.json` * `$PROJECT_FOLDER/.claude/settings.local.json` | 仅对当前项目或工作区生效。 |
| Windows |

提示

多个 Hook 配置文件共存时，TRAE 的行为如下：

* 若一个工作区内包含多个项目根目录，且多个项目中都存在已启用的项目级 Hook 配置，TRAE 会读取这些配置并合并执行。
* 若同时启用 Claude Code Hook 和 TRAE Hook，TRAE 会读取所有已启用的 Hook 配置并合并执行。

### Hook 配置格式

`hooks.json` 文件的配置格式如下：

```
{
  "version": 1,
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<ToolPattern>",
        "loop_limit": 5,
        "hooks": [
          {
            "type": "command",
            "command": "<shell command>",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 字段说明

Hook 相关字段的说明如下：

* **顶层结构** 

  | **字段** | **类型** | **是否必填** | **描述** |
  | --- | --- | --- | --- |
  | `version` | `number` | 否 | 配置文件的 schema 版本，默认为 `1`，且当前仅支持 `1`。 |
  | `hooks` | `object` | 是 | Hook 事件名到 Hook 组的映射。 |
* **事件层（`hooks.<EventName>`）** 

  | **字段** | **类型** | **是否必填** | **描述** |
  | --- | --- | --- | --- |
  | `<EventName>` | `array` | 是 | 某个 Hook 事件下的 Hook 组列表。 |
* **Hook 组层** 

  | **字段** | **类型** | **是否必填** | **描述** |
  | --- | --- | --- | --- |
  | `matcher` | `string` | 否 | 匹配规则，支持正则表达式（如 `Edit|Write`、`mcp.*`）。配置为 `*`、空字符串或省略时，表示匹配所有工具或通知类型。  ***提示***：`matcher` 字段仅对 `PreToolUse`、`PostToolUse` 和 `Notification` 事件有效。 |
  | `loop_limit` | `number` | 否 | 循环次数限制。  当 `loop_count` ≥ `loop_limit` 时，该 Hook 组将被跳过。  该字段仅支持正整数；未配置或配置的值小于等于 `0` 时，使用默认值 `5`。  ***提示***：`loop_limit` 字段仅对 `Stop` 事件有效。 |
  | `hooks` | `array` | 是 | 该 Hook 组下要执行的 Hook 列表。 |
* **Hook 定义层** 

  | **字段** | **类型** | **是否必填** | **描述** |
  | --- | --- | --- | --- |
  | `type` | `string` | 否 | Hook 类型，默认为 “命令” 类型（`command`），且当前仅支持 `command`。 |
  | `command` | `string` | 是 | 要执行的 Shell 命令。 |
  | `timeout` | `number` | 否 | 超时时间（秒），默认 `30`。 |

## Hook 输入和输出

所有 Hook 命令都遵循标准的输入/输出（I/O）机制：通过 `stdin` 接收 JSON 格式的输入，并通过 `stdout` 输出和退出码来控制智能体的行为。

### stdin 通用字段

每个 Hook 事件的 `stdin` JSON 都包含以下通用字段：

```
{
  "session_id": "string",
  "cwd": "/path/to/workspace",
  "hook_event_name": "PreToolUse",
  "workspace_roots": ["/path/to/workspace"]
}
```

| **字段** | **类型** | **描述** |
| --- | --- | --- |
| `session_id` | `string` | 当前会话 ID。 |
| `cwd` | `string` | 当前 Hook 命令的实际工作目录。详情参考[工作目录](/ide/reference-for-hooks-configuration#hY1ItIaDA)。 |
| `hook_event_name` | `string` | 当前 Hook 事件的名称。 |
| `workspace_roots` | `string[]` | 如果存在多个工作区，此字段将包含所有工作区的根目录。 |

### stdout 通用字段

Hook 命令可以通过 `stdout` 输出两种格式的数据：

* **JSON** ：用于结构化地控制智能体的执行流程。
* **纯文本**：输出内容将作为附加上下文提供给模型。此格式仅适用于 `SessionStart` 和 `UserPromptSubmit` 事件。

对于 JSON 格式的输出，所有事件均支持以下通用流程控制字段：

```
{
  "continue": true,
  "stopReason": "string"
}
```

| **字段** | **类型** | **默认值** | **描述** |
| --- | --- | --- | --- |
| `continue` | `boolean` | `true` | 智能体是否在 Hook 执行完毕后继续执行。若设置为 `false`，智能体将停止执行。该字段优先于任何事件特定的 `decision` 字段。 |
| `stopReason` | `string` | — | 当 `continue` 为 `false` 时，展示给用户的智能体停止执行的原因。 |

### 退出码行为

| **退出码** | **行为** |
| --- | --- |
| `0` | 正常退出。`stdout` 的内容将根据 Hook 事件类型被解析为 JSON 或纯文本。 |
| `2` | 阻断性错误。`stderr` 的内容将作为错误信息传递给模型的上下文。此错误在不同 Hook 事件中的具体行为有所不同，详见 [Hook 事件](/ide/reference-for-hooks-configuration#hdWvxt1k1)。 |
| 其他 | 非阻断性错误。这类错误不会影响智能体的执行流程，其 `stderr` 和 `stdout` 输出会被忽略。 |

## Hook 执行环境

### Shell

Hook 命令会在系统默认 Shell 中执行：

* **macOS/Linux**：默认使用 Bash。
* **Windows**：默认使用 PowerShell。

### 环境变量

Hook 命令执行时，可通过以下环境变量获取上下文：

| **环境变量** | **描述** |
| --- | --- |
| `TRAE_PROJECT_DIR` | 当前 Hook 命令的工作区目录，与 `stdin.cwd` 一致。 |
| `CLAUDE_PROJECT_DIR` | 兼容 Claude Code Hook 的工作区目录变量，与 `stdin.cwd` 一致。 |

`SessionStart` 事件会额外注入以下环境变量，用于向当前会话的后续执行环境写入变量：

| **环境变量** | **描述** |
| --- | --- |
| `TRAE_ENV_FILE` | TRAE 环境变量文件路径，仅在 `SessionStart` 事件中注入。 |
| `CLAUDE_ENV_FILE` | 兼容 Claude Code Hook 的环境变量文件路径，仅在 `SessionStart` 事件中注入。 |

### 环境变量文件

`SessionStart` 事件的 Hook 可以向 `TRAE_ENV_FILE` 指向的文件写入环境变量。写入的变量会在当前会话后续的 Hook 执行以及 `RunCommand` 工具调用中生效，但不会影响当前正在执行的 `SessionStart` Hook 进程。

支持以下三种格式：

* Bash 格式：

  ```
  export NODE_ENV=production
  export PATH="/usr/local/bin"
  ```
* PowerShell 格式：

  ```
  $env:NODE_ENV=production
  ```
* Dotenv 格式：

  ```
  NODE_ENV=production
  MY_VAR="hello world"
  ```

### 工作目录

Hook 命令执行时的工作目录如下：

| **Hook 命令类型** | **工作目录** |
| --- | --- |
| 全局 Hook 命令 | * 单工作区：该工作区的根目录。 * 多工作区：第一个工作区的根目录。 |
| 项目 Hook 命令 | 该 Hook 配置文件所在项目的根目录。 |

### 运行方式

Hook 命令的实际权限和可访问范围取决于你所设置的运行方式：

* **沙箱运行**：Hook 命令在沙箱中自动执行，文件访问和系统权限会受到沙箱限制。
* **本地自动运行**：Hook 命令在沙箱外自动执行，可访问本地环境，存在更高安全风险，请谨慎选择。

关于如何设置 Hook 命令的运行方式，参考[设置 Hook 命令的运行方式](/ide/automate-actions-with-hooks#bb41f71f)。

## Hook 事件

### SessionStart

* **触发时机**：创建 Session 后、发起第一个对话之前触发。
* **Hook 的作用**：初始化环境、注入上下文信息或设置环境变量。
* **`stdin`**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "SessionStart",
    "source": "startup"
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `source` | `string` | 会话的来源。目前仅支持 `startup`（新建会话）。 |
* **`stdout`**：
  + **格式一：纯文本**  
    直接输出纯文本内容，将其作为附加上下文提供给模型。
  + **格式二：JSON**

    ```
    {
      "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "文本内容"
      }
    }
    ```

    | **字段** | **类型** | **描述** |
    | --- | --- | --- |
    | `additionalContext` | `string` | 附加给模型的上下文。 |
* **环境变量注入**：通过向 `$TRAE_ENV_FILE` 文件写入键值对，可以为 Hook 后续的执行环境注入环境变量。
* **退出码** **`2` 的行为**：不影响会话流程。

### UserPromptSubmit

* **触发时机**：用户发送消息后、智能体开始处理前。
* **Hook 的作用**：拦截不允许的请求，或向模型附加上下文。
* **`stdin`**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "UserPromptSubmit",
    "prompt": "用户输入的 Prompt"
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `prompt` | `string` | 用户提交的 Prompt 文本。 |
* **`stdout`**：
  + **格式一：纯文本**  
    直接输出非 JSON 格式的纯文本内容，将其作为附加上下文提供给模型。
  + **格式二：JSON**

    ```
    {
      "decision": "block",
      "reason": "该请求不被允许的原因",
      "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": "附加给模型的上下文"
      }
    }
    ```

    | **字段** | **类型** | **描述** |
    | --- | --- | --- |
    | `decision` | `string` | 该字段仅支持设为 `block`。设置后，将禁止智能体执行该 Prompt。如需允许智能体执行该 Prompt，请将该字段留空。 |
    | `reason` | `string` | 当 `decision` 字段的值为 `block` 时，此字段的内容将作为错误信息展示给用户。否则，该字段将被忽略。 |
    | `additionalContext` | `string` | 附加给模型的上下文文本。 |
* **退出码** **`2` 的行为**：等价于 `"decision": "block"`，直接禁止智能体执行该 Prompt，并将 `stderr` 内容展示给用户。

### PreToolUse

* **触发时机**：智能体发起工具调用后、实际执行前。
* **Hook 的作用**：校验或拦截工具调用、修改工具参数，或要求用户确认后再执行。
* **`matcher` 字段配置**：可通过 `matcher` 字段配置正则表达式，从而匹配特定的工具名。
* **`stdin`**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "PreToolUse",
    "tool_use_id": "toolcall-id-string",
    "tool_name": "RunCommand",
    "llm_tool_name": "RunCommand",
    "tool_input": { ... }
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `tool_use_id` | `string` | 工具调用的唯一 ID。 |
  | `tool_name` | `string` | 标准化的工具名称。详见 [PreToolUse 和 PostToolUse 事件支持的工具](/ide/reference-for-hooks-configuration#hVL37mbtD)。 |
  | `llm_tool_name` | `string` | 传递给大语言模型的原始工具名称。 |
  | `tool_input` | `object` | 工具输入参数。 |
* **`stdout`**：

  ```
  {
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow", 
      "permissionDecisionReason": "决策原因说明",
      "updatedInput": { ... },
      "additionalContext": "附加给模型的上下文"
    }
  }
  ```

  | **字段** | **类型** | **说明** |
  | --- | --- | --- |
  | `permissionDecision` | `string` | 权限决策，用于决定是否执行本次工具调用。可选值包括：  + `allow`：允许执行。 + `deny`：拒绝执行。 + `ask`：弹出确认框，由用户决定是否执行。 ***特殊情况说明***：  + 如果多个 `PreToolUse` 事件的 Hook 正并行执行，`permissionDecision` 只会返回一个最终值。取值优先级为： `deny` -> `ask` -> `allow`。 + 如果返回值为 `allow`，但是该工具的运行模式为手动确认，则仍以工具运行模式为准，需要用户确认。 |
  | `permissionDecisionReason` | `string` | 权限决策的原因。 |
  | `updatedInput` | `object` | 修改后的工具输入参数，将整体覆盖替换原始参数（非合并更新）。 |
  | `additionalContext` | `string` | 附加给模型的上下文文本。 |
* **退出码** **`2` 的行为**：等价于 `"permissionDecision": "deny"`，拒绝让智能体执行本次工具调用，并将 `stderr` 内容作为原因附加给模型的上下文。

### PostToolUse

* **触发时机**：工具调用实际执行完成后。
* **Hook 的作用**：校验执行结果或附加上下文。
* **`matcher` 字段配置**：可通过 `matcher` 字段配置正则表达式，从而匹配特定的工具名。
* **`stdin`**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "PostToolUse",
    "tool_use_id": "toolcall-id-string",
    "tool_name": "RunCommand",
    "llm_tool_name": "RunCommand",
    "tool_input": { ... },
    "tool_response": { ... }
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `tool_use_id` | `string` | 工具调用的唯一 ID。 |
  | `tool_name` | `string` | 标准化的工具名称。详见 [PreToolUse 和 PostToolUse 事件支持的工具](/ide/reference-for-hooks-configuration#hVL37mbtD)。 |
  | `llm_tool_name` | `string` | 传递给大语言模型的原始工具名称。 |
  | `tool_input` | `object` | 工具输入参数。 |
  | `tool_response` | `object` | 工具调用的结果。 |
* **`stdout`**：

  ```
  {
    "decision": "block",
    "reason": "阻断原因",
    "hookSpecificOutput": {
      "hookEventName": "PostToolUse",
      "additionalContext": "附加给模型的上下文"
    }
  }
  ```

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `decision` | `string` | 该字段仅支持设为 `block`。设置后，会向模型传递一条阻断信息，表示工具已执行且无法撤销。如需允许智能体继续处理工具调用的结果，将该字段留空。 |
  | `reason` | `string` | 当 `decision` 字段的值为 `block` 时，此字段的内容将作为阻断原因展示给用户。否则，该字段将被忽略。 |
  | `additionalContext` | `string` | 附加给模型的上下文文本。 |
* **退出码** **`2` 的行为**：将 `stderr` 传递给模型的上下文。

### Stop

* **触发时机**：智能体完成输出、准备结束当前查询时。此时，你可以检查智能体的输出是否达标；若不达标，可以阻止智能体结束任务并要求其继续处理。
* **Hook 的作用**：阻止智能体结束当前任务，并要求其继续执行。
* **`stdin`**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "Stop",
    "stop_hook_active": false,
    "loop_count": 0, 
    "last_assistant_message": "大语言模型最终输出的文本内容"
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `stop_hook_active` | `boolean` | 当前查询是否已经被 `Stop` 事件的 Hook 至少阻断过一次。 |
  | `loop_count` | `number` | 当前查询的 `Stop` 事件被 Hook 阻断的次数计数。从 `0` 开始累加。  ***循环限制***：你可以通过 `loop_limit` 字段配置该 Hook 组允许阻断 `Stop` 事件的最大次数。当 `loop_count` ≥ `loop_limit` 时，该 Hook 组将被跳过，使智能体不再执行，以避免无限循环。`loop_limit` 的默认值为 `5`。 |
  | `last_assistant_message` | `string` | 大语言模型最终输出的文本内容。 |
* **`stdout`**：

  ```
  {
    "decision": "block",
    "reason": "请继续检查测试是否通过"
  }
  ```

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `decision` | `string` | 该字段仅支持设为 `block`。设置后，将阻断智能体停止执行。如需让智能体停止执行，将该字段留空。 |
  | `reason` | `string` | 当 `decision` 字段的值为 `block` 时，此字段的内容将作为新的用户请求让智能体继续执行。否则，该字段将被忽略。 |
* **退出码** **`2` 的行为**：等价于 `"decision": "block"`，阻断智能体停止执行，并将 `stderr` 作为新的用户请求让智能体继续执行。
* **决策控制流程：**  
  `Stop` 事件的决策控制逻辑如下：

  ```
  智能体准备停止
      │
      ▼
  检查 loop_count 是否大于等于 loop_limit？──── 是 ──► 跳过 Hook，允许智能体停止
      │
     否
      │
      ▼
  执行 Stop 事件的 Hook 脚本
      │
      ├── 退出码为 0，且 decision 字段为空 ───────► 允许停止
      │
      ├── 退出码为 0，且 decision 字段的值为 block ──► 阻断停止，将 reason 字段作为新 Query
      │
      ├── 退出码为 2 ───────────────────► 阻断停止，将 stderr 作为新 Query
      │
      └── 其他退出码 ───────────────────► 忽略错误，允许停止
  ```

### Notification

* **触发时机**：智能体的工具调用等待用户确认时，或智能体完成任务时。该事件异步执行，不会阻塞智能体的主流程。
* **Hook 的作用**：发送通知，不改变智能体的执行流程。
* **`matcher` 字段配置**：基于通知类型（`notification_type`）匹配，而不是基于工具名匹配。未配置 `matcher`，或将其配置为空字符串或 `*` 时，表示匹配所有通知类型。
* **stdin**：

  ```
  {
    "session_id": "...",
    "hook_event_name": "Notification",
    "notification_type": "idle_prompt",
    "message": "智能体已完成任务",
    "tool_use_id": "toolu_xxx"
  }
  ```

  该事件的专有字段如下： 

  | **字段** | **类型** | **描述** |
  | --- | --- | --- |
  | `notification_type` | `string` | 通知类别，用于标识通知场景，也用于匹配 `matcher` 字段的配置。可选值见下表。 |
  | `message` | `string` | 通知的正文。 |
  | `tool_use_id` | `string?` | 关联的工具调用 ID。  仅工具调用相关的通知类型携带该 ID，例如 `permission_prompt`、`document_review` 等。任务完成时发送的 `idle_prompt` 类通知不携带该 ID。 |

  `notification_type` 字段的值和相应触发时机如下： 

  | **值** | **触发时机** |
  | --- | --- |
  | `idle_prompt` | 智能体完成当前任务。 |
  | `permission_prompt` | 工具调用需要用户确认后才能继续执行，例如当 `PreToolUse` 事件的 Hook 返回 `ask` 决策，或工具本身需要手动确认时。 |
  | `document_review` | Plan 或 Spec 工作流中的文档审阅流程。 |
  | `ask_user_question` | 智能体需要用户补充信息时，进行提问的通知。 |
  | `browser_interaction` | 浏览器交互等待通知。 |
* **`stdout`**：该事件会忽略 Hook 进程的 `stdout` 输出。即使输出 JSON，也不会影响智能体的行为。
* **退出码的行为**：任意退出码均视为非阻断性结果。Hook 进程的 `stdout`、`stderr` 和退出码不会改变智能体的执行流程。

## PreToolUse 和 PostToolUse 事件支持的工具

在 `PreToolUse` 和 `PostToolUse` 事件中，你可以通过 `matcher` 字段匹配 `tool_name`。

`tool_name` 为标准化工具名称，取值如下：

| **分类** | **工具名称** | **描述** |
| --- | --- | --- |
| 文件读取 | `Read` | 读取文件内容。 |
| 文件写入 | `Write` | 写入文件。 |
| 文件编辑 | `Edit` | 单次查找并替换文件内容。 |
| 搜索 | `Glob` | 基于文件路径模式进行匹配搜索。 |
| `Grep` | 基于正则表达式进行内容搜索。 |
| `LS` | 列出目录下的文件与子目录。 |
| 终端 | `RunCommand` | 执行终端命令。 |
| 网络 | `WebSearch` | 网络搜索。 |
| `WebFetch` | 获取网页内容。 |
| 交互 | `AskUserQuestion` | 向用户提问。 |
| Skill | `Skill` | 加载 Skill。 |
| MCP | `mcp__<serverName>__<toolName>` | MCP 工具。  **MCP 工具匹配说明**：在 Hook 中，MCP 工具的标准化名称格式为 `mcp__<serverName>__<toolName>`（例如 `mcp__Git__iCube__git_status`）。你可以在 `matcher` 字段中使用 `mcp__.*` 来匹配所有 MCP 工具，或使用具体工具的名称进行精确匹配。 |

## 示例

### **会话开始时，注入项目上下文**

本示例用于在会话启动时自动注入项目级上下文和环境变量，使智能体在开始处理任务前即可获取项目名称、运行环境、技术栈和代码规范等信息。

**Hook 配置**：监听 `SessionStart` 事件，并在事件触发时执行 `setup_env.sh` 脚本。

macOS / Linux
Windows

```
{
  "version": 1,
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "command": "bash ./scripts/setup_env.sh"
          }
        ]
      }
    ]
  }
}
```

```
{
  "version": 1,
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "command": "powershell -ExecutionPolicy Bypass -File ./scripts/setup_env.ps1"
          }
        ]
      }
    ]
  }
}
```

**`setup_env.sh` 脚本示例**：该脚本会向 `$TRAE_ENV_FILE` 写入环境变量，使其在后续 Hook 和 `RunCommand` 工具调用中生效；同时通过标准输出向模型补充项目背景信息。

macOS / Linux
Windows

```
#!/bin/bash
# 向环境变量文件写入项目配置
echo "export PROJECT_NAME=my-app" >> "$TRAE_ENV_FILE"
echo "export NODE_ENV=development" >> "$TRAE_ENV_FILE"

# 输出上下文信息给模型
echo "当前项目：my-app，技术栈：React + TypeScript，请遵循 ESLint 规范。"
```

```
# 向环境变量文件写入项目配置
Add-Content -Path $env:TRAE_ENV_FILE -Value "`$env:PROJECT_NAME='my-app'"
Add-Content -Path $env:TRAE_ENV_FILE -Value "`$env:NODE_ENV='development'"

# 输出上下文信息给模型
Write-Output "当前项目：my-app，技术栈：React + TypeScript，请遵循 ESLint 规范。"
```

### **终端命令执行前，拦截高风险操作**

本示例用于在终端命令真正执行前识别并拦截高风险操作，降低误删文件、执行破坏性命令或提交危险数据库操作的风险。

**Hook 配置**：监听 `PreToolUse` 事件，并通过 `matcher` 仅匹配 `RunCommand` 工具。只有当智能体准备执行终端命令时，才会触发该 Hook。

```
{
  "version": 1,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "RunCommand",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ./validate_command.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**`validate_command.py` 脚本示例**：该脚本从 `stdin` 读取工具输入，提取待执行命令，并检查命令内容是否包含预设的危险模式。若命中危险模式，脚本返回 `"permissionDecision": "deny"` 和拒绝原因，从而阻止该命令执行；若未命中，则正常退出并允许继续执行。

```
#!/usr/bin/env python3
import sys, json

input_data = json.load(sys.stdin)
command = input_data.get("tool_input", {}).get("command", "")

dangerous_patterns = ["rm -rf /", "DROP TABLE", "format C:"]
for pattern in dangerous_patterns:
    if pattern in command:
        result = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"high risk command detected: {pattern}"
            }
        }
        json.dump(result, sys.stdout)
        sys.exit(0)

# 允许执行
sys.exit(0)
```

### 任务结束前，自动**运行验收测试**

本示例用于在智能体准备结束当前任务前自动执行验收测试，并根据测试结果决定是否允许停止。如果测试未通过，Hook 会要求智能体继续修复问题，而不是直接结束任务。

提示

如需测试本示例，配置完成后，可向智能体发送消息 “测试 stop hook” 来验证效果。

**Hook 配置**：监听 `Stop` 事件，并设置 `loop_limit` 限制最多阻断次数，避免测试持续失败时造成无限循环。

macOS / Linux
Windows

```
{
  "version": 1,
  "hooks": {
    "Stop": [
      {
        "loop_limit": 3,
        "hooks": [
          {
            "command": "python3 ./check_tests.py",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

```
{
  "version": 1,
  "hooks": {
    "Stop": [
      {
        "loop_limit": 3,
        "hooks": [
          {
            "command": "python ./check_tests.py", // 或使用 py ./check_tests.py 命令
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**`check_tests.py` 脚本示例**：该脚本会运行 `npm test` 并读取测试结果。若测试失败，该脚本返回 `"decision": "block"` 和失败原因，并带上当前阻断次数，要求智能体继续修复；若测试通过，则正常退出并允许智能体停止。

```
#!/usr/bin/env python3
import sys, json, subprocess

input_data = json.load(sys.stdin)
loop_count = input_data.get("loop_count", 0)

# 运行测试
result = subprocess.run(["npm", "test"], capture_output=True, text=True)

if result.returncode != 0:
    output = {
        "decision": "block",
        "reason": f"测试未通过（第 {loop_count + 1} 次检查），请修复以下失败:\n{result.stdout[-500:]}"
    }
    json.dump(output, sys.stdout)
else:
    # 测试通过，允许停止
    sys.exit(0)
```

文档对您有帮助吗?

有帮助无帮助

[上一篇

通过 Hook 实现自动化](/ide_automate-actions-with-hooks)[下一篇

超级代码补全：CUE](/ide_cue)

[Hook 配置](#hpYc1MTXR "Hook 配置")

[Hook 配置文件位置](#hVtqNOGAW "Hook 配置文件位置")

[Hook 配置格式](#heInRRDLu "Hook 配置格式")

[字段说明](#hkYlOV7N4 "字段说明")

[Hook 输入和输出](#hnKa5QHcx "Hook 输入和输出")

[stdin 通用字段](#hg8obZh6J "stdin 通用字段")

[stdout 通用字段](#hC4VRds8c "stdout 通用字段")

[退出码行为](#hJ6tfkeYP "退出码行为")

[Hook 执行环境](#hBUXrFSk1 "Hook 执行环境")

[Shell](#hgYpfWu5v "Shell")

[环境变量](#hRUMJ3WpS "环境变量")

[环境变量文件](#hn83Zt3yS "环境变量文件")

[工作目录](#hY1ItIaDA "工作目录")

[运行方式](#hjm9HzFBp "运行方式")

[Hook 事件](#hdWvxt1k1 "Hook 事件")

[SessionStart](#hc6qUfnp5 "SessionStart")

[UserPromptSubmit](#hbQz4wglt "UserPromptSubmit")

[PreToolUse](#hLajk7S6u "PreToolUse")

[PostToolUse](#hi9FVzBqc "PostToolUse")

[Stop](#hwn0daaUW "Stop")

[Notification](#hC6Vnzhd3 "Notification")

[PreToolUse 和 PostToolUse 事件支持的工具](#hVL37mbtD "PreToolUse 和 PostToolUse 事件支持的工具")

[示例](#hsw0pL8zc "示例")

[会话开始时，注入项目上下文](#hkmiH25S6 "会话开始时，注入项目上下文")

[终端命令执行前，拦截高风险操作](#hktTsMSHA "终端命令执行前，拦截高风险操作")

[任务结束前，自动运行验收测试](#hQPwXC4Db "任务结束前，自动运行验收测试")

window.collectEvent("init",{app\_id:945902,disable\_auto\_pv:!0,channel:"cn"}),window.collectEvent("config",{platform\_env:"renderer",platform\_host:"undefined"!=typeof location?location.host:""}),window.collectEvent("start")["6493","7756","7807","3234","9150","3313"]{"namedChunks":["$","rag-widget"]}window.\_SSR\_DATA = {"data":{},"context":{"request":{"params":{},"query":{},"pathname":"\u002Fide\_hook-configuration-reference","host":"docs.trae.cn","url":"https:\u002F\u002Fdocs.trae.cn\u002Fide\_hook-configuration-reference"},"reporter":{}},"mode":"string","renderLevel":2}
window.\_ROUTER\_DATA = {"loaderData":{"layout":{"prefectLang":"zh","url":"http:\u002F\u002Fdocs.trae.cn\u002Fide\_hook-configuration-reference","env":"prod"},"$":{"code":0,"data":{"basePath":"\u002F","doc":{"tab\_id":"67a5b43a9ae5aa03545c7a07","path":"ide\_hook-configuration-reference","\_id":"6a3e2cb5d6149c01ba317774","title":"Hook 配置详解","content":"本文档介绍 TRAE IDE 中 Hook 的配置方式、执行环境、输入输出规范，以及各类事件的触发与处理机制。\n\n## Hook 配置 {#hpYc1MTXR}\n\n### Hook 配置文件位置 {#hVtqNOGAW}\n\nTRAE 支持全局 Hook 和项目 Hook。两类配置文件在不同操作系统中的存储位置如下：\n\n\u003C!-- @cols-width: 125,140,314,265 --\u003E\n|\*\*Hook 类型\*\* |\*\*操作系统\*\* |\*\*Hook 配置文件位置\*\* |\*\*作用范围\*\* |\n|---|---|---|---|\n|全局 Hook |macOS & Linux |`~\u002F.trae-cn\u002Fhooks.json` |对本机当前用户下的所有工作区生效。 |\n|^^| | |^^| \\\n| |Windows |`%userprofile%\u002F.trae-cn\u002Fhooks.json` | |\n|项目 Hook |macOS & Linux |`$PROJECT\_FOLDER\u002F.trae\u002Fhooks.json` |\\\n| | | |\\\n| | |若当前工作区包含多个项目，默认会在第一个项目中创建配置文件。 |仅对当前项目或工作区生效。 |\n|^^| |^^|^^| \\\n| |Windows | | |\n\n同时，TRAE 支持读取 Claude Code 中的 Hook 配置，配置流程参考[导入 Claude Code 中的 Hook](\u002Fide\u002Fautomate-actions-with-hooks#4c6238cd)。Claude Code 同样支持全局与项目 Hook：\n\n\u003C!-- @cols-width: 125,140,366,215 --\u003E\n|\*\*Hook 类型\*\* |\*\*操作系统\*\* |\*\*Hook 配置文件位置\*\* |\*\*作用范围\*\* |\n|---|---|---|---|\n|全局 Hook |macOS & Linux |`~\u002F.claude\u002Fsettings.json` |对本机当前用户下的所有工作区生效。 |\n|^^| | |^^| \\\n| |Windows |`%userprofile%\u002F.claude\u002Fsettings.json` | |\n|项目 Hook |macOS & Linux |\* `$PROJECT\_FOLDER\u002F.claude\u002Fsettings.json` |\\\n| | |\* `$PROJECT\_FOLDER\u002F.claude\u002Fsettings.local.json` |仅对当前项目或工作区生效。 |\n|^^| |^^|^^| \\\n| |Windows | | |\n\n:::tip 提示\n多个 Hook 配置文件共存时，TRAE 的行为如下：\n\n\* 若一个工作区内包含多个项目根目录，且多个项目中都存在已启用的项目级 Hook 配置，TRAE 会读取这些配置并合并执行。\n\* 若同时启用 Claude Code Hook 和 TRAE Hook，TRAE 会读取所有已启用的 Hook 配置并合并执行。\n:::\n\n### Hook 配置格式 {#heInRRDLu}\n\n`hooks.json` 文件的配置格式如下：\n\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"\u003CEventName\u003E\": [\n {\n \"matcher\": \"\u003CToolPattern\u003E\",\n \"loop\_limit\": 5,\n \"hooks\": [\n {\n \"type\": \"command\",\n \"command\": \"\u003Cshell command\u003E\",\n \"timeout\": 30\n }\n ]\n }\n ]\n }\n}\n```\n\n### 字段说明 {#hkYlOV7N4}\n\nHook 相关字段的说明如下：\n\n\* \*\*顶层结构\*\*\n \u003C!-- @cols-width: 149,127,100,433 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*是否必填\*\* |\*\*描述\*\* |\n |---|---|---|---|\n |`version` |`number` |否 |配置文件的 schema 版本，默认为 `1`，且当前仅支持 `1`。 |\n |`hooks` |`object` |是 |Hook 事件名到 Hook 组的映射。 |\n\* \*\*事件层（`hooks.\u003CEventName\u003E`）\*\*\n \u003C!-- @cols-width: 151,122,100,435 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*是否必填\*\* |\*\*描述\*\* |\n |---|---|---|---|\n |`\u003CEventName\u003E` |`array` |是 |某个 Hook 事件下的 Hook 组列表。 |\n\* \*\*Hook 组层\*\*\n \u003C!-- @cols-width: 149,122,100,437 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*是否必填\*\* |\*\*描述\*\* |\n |---|---|---|---|\n |`matcher` |`string` |否 |匹配规则，支持正则表达式（如 `Edit|Write`、`mcp.\*`）。配置为 `\*`、空字符串或省略时，表示匹配所有工具或通知类型。 |\\\n | | | | |\\\n | | | |\*\*\*提示\*\*\*：`matcher` 字段仅对 `PreToolUse`、`PostToolUse` 和 `Notification` 事件有效。 |\n |`loop\_limit` |`number` |否 |循环次数限制。 |\\\n | | | | |\\\n | | | |当 `loop\_count` ≥ `loop\_limit` 时，该 Hook 组将被跳过。 |\\\n | | | | |\\\n | | | |该字段仅支持正整数；未配置或配置的值小于等于 `0` 时，使用默认值 `5`。 |\\\n | | | | |\\\n | | | |\*\*\*提示\*\*\*：`loop\_limit` 字段仅对 `Stop` 事件有效。 |\n |`hooks` |`array` |是 |该 Hook 组下要执行的 Hook 列表。 |\n\* \*\*Hook 定义层\*\*\n \u003C!-- @cols-width: 147,122,100,444 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*是否必填\*\* |\*\*描述\*\* |\n |---|---|---|---|\n |`type` |`string` |否 |Hook 类型，默认为 “命令” 类型（`command`），且当前仅支持 `command`。 |\n |`command` |`string` |是 |要执行的 Shell 命令。 |\n |`timeout` |`number` |否 |超时时间（秒），默认 `30`。 | \n\n\n## Hook 输入和输出 {#hnKa5QHcx}\n\n所有 Hook 命令都遵循标准的输入\u002F输出（I\u002FO）机制：通过 `stdin` 接收 JSON 格式的输入，并通过 `stdout` 输出和退出码来控制智能体的行为。\n\n### stdin 通用字段 {#hg8obZh6J}\n\n每个 Hook 事件的 `stdin` JSON 都包含以下通用字段：\n\n```JSON\n{\n \"session\_id\": \"string\",\n \"cwd\": \"\u002Fpath\u002Fto\u002Fworkspace\",\n \"hook\_event\_name\": \"PreToolUse\",\n \"workspace\_roots\": [\"\u002Fpath\u002Fto\u002Fworkspace\"]\n}\n```\n\n\u003C!-- @cols-width: 274,278,298 --\u003E\n|\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n|---|---|---|\n|`session\_id` |`string` |当前会话 ID。 |\n|`cwd` |`string` |当前 Hook 命令的实际工作目录。详情参考[工作目录](\u002Fide\u002Freference-for-hooks-configuration#hY1ItIaDA)。 |\n|`hook\_event\_name` |`string` |当前 Hook 事件的名称。 |\n|`workspace\_roots` |`string[]` |如果存在多个工作区，此字段将包含所有工作区的根目录。 |\n\n### stdout 通用字段 {#hC4VRds8c}\n\nHook 命令可以通过 `stdout` 输出两种格式的数据：\n\n\* \*\*JSON\*\* ：用于结构化地控制智能体的执行流程。\n\* \*\*纯文本\*\*：输出内容将作为附加上下文提供给模型。此格式仅适用于 `SessionStart` 和 `UserPromptSubmit` 事件。\n\n对于 JSON 格式的输出，所有事件均支持以下通用流程控制字段：\n\n```JSON\n{\n \"continue\": true,\n \"stopReason\": \"string\"\n}\n```\n\n\u003C!-- @cols-width: 132,107,103,506 --\u003E\n|\*\*字段\*\* |\*\*类型\*\* |\*\*默认值\*\* |\*\*描述\*\* |\n|---|---|---|---|\n|`continue` |`boolean` |`true` |智能体是否在 Hook 执行完毕后继续执行。若设置为 `false`，智能体将停止执行。该字段优先于任何事件特定的 `decision` 字段。 |\n|`stopReason` |`string` |— |当 `continue` 为 `false` 时，展示给用户的智能体停止执行的原因。 |\n\n### 退出码行为 {#hJ6tfkeYP}\n\n\u003C!-- @cols-width: 152,690 --\u003E\n|\*\*退出码\*\* |\*\*行为\*\* |\n|---|---|\n|`0` |正常退出。`stdout` 的内容将根据 Hook 事件类型被解析为 JSON 或纯文本。 |\n|`2` |阻断性错误。`stderr` 的内容将作为错误信息传递给模型的上下文。此错误在不同 Hook 事件中的具体行为有所不同，详见 [Hook 事件](\u002Fide\u002Freference-for-hooks-configuration#hdWvxt1k1)。 |\n|其他 |非阻断性错误。这类错误不会影响智能体的执行流程，其 `stderr` 和 `stdout` 输出会被忽略。 |\n\n## Hook 执行环境 {#hBUXrFSk1}\n\n### Shell {#hgYpfWu5v}\n\nHook 命令会在系统默认 Shell 中执行：\n\n\* \*\*macOS\u002FLinux\*\*：默认使用 Bash。\n\* \*\*Windows\*\*：默认使用 PowerShell。\n\n### 环境变量 {#hRUMJ3WpS}\n\nHook 命令执行时，可通过以下环境变量获取上下文：\n\n\u003C!-- @cols-width: 278,564 --\u003E\n|\*\*环境变量\*\* |\*\*描述\*\* |\n|---|---|\n|`TRAE\_PROJECT\_DIR` |当前 Hook 命令的工作区目录，与 `stdin.cwd` 一致。 |\n|`CLAUDE\_PROJECT\_DIR` |兼容 Claude Code Hook 的工作区目录变量，与 `stdin.cwd` 一致。 |\n\n`SessionStart` 事件会额外注入以下环境变量，用于向当前会话的后续执行环境写入变量：\n\n\u003C!-- @cols-width: 278,564 --\u003E\n|\*\*环境变量\*\* |\*\*描述\*\* |\n|---|---|\n|`TRAE\_ENV\_FILE` |TRAE 环境变量文件路径，仅在 `SessionStart` 事件中注入。 |\n|`CLAUDE\_ENV\_FILE` |兼容 Claude Code Hook 的环境变量文件路径，仅在 `SessionStart` 事件中注入。 |\n\n### 环境变量文件 {#hn83Zt3yS}\n\n`SessionStart` 事件的 Hook 可以向 `TRAE\_ENV\_FILE` 指向的文件写入环境变量。写入的变量会在当前会话后续的 Hook 执行以及 `RunCommand` 工具调用中生效，但不会影响当前正在执行的 `SessionStart` Hook 进程。\n\n支持以下三种格式：\n\n\* Bash 格式：\n ```Bash\n export NODE\_ENV=production\n export PATH=\"\u002Fusr\u002Flocal\u002Fbin\"\n ```\n\* PowerShell 格式：\n ```PowerShell\n $env:NODE\_ENV=production\n ```\n\* Dotenv 格式：\n ```Bash\n NODE\_ENV=production\n MY\_VAR=\"hello world\"\n ``` \n\n\n### 工作目录 {#hY1ItIaDA}\n\nHook 命令执行时的工作目录如下：\n\n\u003C!-- @cols-width: 146,446 --\u003E\n|\*\*Hook 命令类型\*\* |\*\*工作目录\*\* |\n|---|---|\n|全局 Hook 命令 |\* 单工作区：该工作区的根目录。 |\\\n| |\* 多工作区：第一个工作区的根目录。 |\n|项目 Hook 命令 |该 Hook 配置文件所在项目的根目录。 |\n\n### 运行方式 {#hjm9HzFBp}\n\nHook 命令的实际权限和可访问范围取决于你所设置的运行方式：\n\n\* \*\*沙箱运行\*\*：Hook 命令在沙箱中自动执行，文件访问和系统权限会受到沙箱限制。\n\* \*\*本地自动运行\*\*：Hook 命令在沙箱外自动执行，可访问本地环境，存在更高安全风险，请谨慎选择。\n\n关于如何设置 Hook 命令的运行方式，参考[设置 Hook 命令的运行方式](\u002Fide\u002Fautomate-actions-with-hooks#bb41f71f)。\n\n## Hook 事件 {#hdWvxt1k1}\n\n### SessionStart {#hc6qUfnp5}\n\n\* \*\*触发时机\*\*：创建 Session 后、发起第一个对话之前触发。\n\* \*\*Hook 的作用\*\*：初始化环境、注入上下文信息或设置环境变量。\n\* \*\*`stdin`\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"SessionStart\",\n \"source\": \"startup\"\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 172,135,388 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`source` |`string` |会话的来源。目前仅支持 `startup`（新建会话）。 |\n\* \*\*`stdout`\*\*：\n \* \*\*格式一：纯文本\*\*\n 直接输出纯文本内容，将其作为附加上下文提供给模型。\n \* \*\*格式二：JSON\*\*\n ```JSON\n {\n \"hookSpecificOutput\": {\n \"hookEventName\": \"SessionStart\",\n \"additionalContext\": \"文本内容\"\n }\n }\n ```\n \u003C!-- @cols-width: 190,143,350 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`additionalContext` |`string` |附加给模型的上下文。 |\n\* \*\*环境变量注入\*\*：通过向 `$TRAE\_ENV\_FILE` 文件写入键值对，可以为 Hook 后续的执行环境注入环境变量。\n\* \*\*退出码\*\* \*\*`2` 的行为\*\*：不影响会话流程。\n\n### UserPromptSubmit {#hbQz4wglt}\n\n\n\* \*\*触发时机\*\*：用户发送消息后、智能体开始处理前。\n\* \*\*Hook 的作用\*\*：拦截不允许的请求，或向模型附加上下文。\n\* \*\*`stdin`\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"UserPromptSubmit\",\n \"prompt\": \"用户输入的 Prompt\"\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 265,242,244 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`prompt` |`string` |用户提交的 Prompt 文本。 |\n\* \*\*`stdout`\*\*：\n \* \*\*格式一：纯文本\*\*\n 直接输出非 JSON 格式的纯文本内容，将其作为附加上下文提供给模型。\n \* \*\*格式二：JSON\*\*\n ```JSON\n {\n \"decision\": \"block\",\n \"reason\": \"该请求不被允许的原因\",\n \"hookSpecificOutput\": {\n \"hookEventName\": \"UserPromptSubmit\",\n \"additionalContext\": \"附加给模型的上下文\"\n }\n }\n ```\n \u003C!-- @cols-width: 175,173,403 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`decision` |`string` |该字段仅支持设为 `block`。设置后，将禁止智能体执行该 Prompt。如需允许智能体执行该 Prompt，请将该字段留空。 |\n |`reason` |`string` |当 `decision` 字段的值为 `block` 时，此字段的内容将作为错误信息展示给用户。否则，该字段将被忽略。 |\n |`additionalContext` |`string` |附加给模型的上下文文本。 |\n\* \*\*退出码\*\* \*\*`2` 的行为\*\*：等价于 `\"decision\": \"block\"`，直接禁止智能体执行该 Prompt，并将 `stderr` 内容展示给用户。\n\n### PreToolUse {#hLajk7S6u}\n\n\n\* \*\*触发时机\*\*：智能体发起工具调用后、实际执行前。\n\* \*\*Hook 的作用\*\*：校验或拦截工具调用、修改工具参数，或要求用户确认后再执行。\n\* \*\*`matcher` 字段配置\*\*：可通过 `matcher` 字段配置正则表达式，从而匹配特定的工具名。\n\* \*\*`stdin`\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"PreToolUse\",\n \"tool\_use\_id\": \"toolcall-id-string\",\n \"tool\_name\": \"RunCommand\",\n \"llm\_tool\_name\": \"RunCommand\",\n \"tool\_input\": { ... }\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 244,150,416 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`tool\_use\_id` |`string` |工具调用的唯一 ID。 |\n |`tool\_name` |`string` |标准化的工具名称。详见 [PreToolUse 和 PostToolUse 事件支持的工具](\u002Fide\u002Freference-for-hooks-configuration#hVL37mbtD)。 |\n |`llm\_tool\_name` |`string` |传递给大语言模型的原始工具名称。 |\n |`tool\_input` |`object` |工具输入参数。 |\n\* \*\*`stdout`\*\*：\n ```JSON\n {\n \"hookSpecificOutput\": {\n \"hookEventName\": \"PreToolUse\",\n \"permissionDecision\": \"allow\", \n \"permissionDecisionReason\": \"决策原因说明\",\n \"updatedInput\": { ... },\n \"additionalContext\": \"附加给模型的上下文\"\n }\n }\n ```\n \u003C!-- @cols-width: 225,100,501 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*说明\*\* |\n |---|---|---|\n |`permissionDecision` |`string` |权限决策，用于决定是否执行本次工具调用。可选值包括： |\\\n | | | |\\\n | | |\* `allow`：允许执行。 |\\\n | | |\* `deny`：拒绝执行。 |\\\n | | |\* `ask`：弹出确认框，由用户决定是否执行。 |\\\n | | | |\\\n | | |\*\*\*特殊情况说明\*\*\*： |\\\n | | | |\\\n | | |\* 如果多个 `PreToolUse` 事件的 Hook 正并行执行，`permissionDecision` 只会返回一个最终值。取值优先级为： `deny` -\u003E `ask` -\u003E `allow`。 |\\\n | | |\* 如果返回值为 `allow`，但是该工具的运行模式为手动确认，则仍以工具运行模式为准，需要用户确认。 |\n |`permissionDecisionReason` |`string` |权限决策的原因。 |\n |`updatedInput` |`object` |修改后的工具输入参数，将整体覆盖替换原始参数（非合并更新）。 |\n |`additionalContext` |`string` |附加给模型的上下文文本。 |\n\* \*\*退出码\*\* \*\*`2` 的行为\*\*：等价于 `\"permissionDecision\": \"deny\"`，拒绝让智能体执行本次工具调用，并将 `stderr` 内容作为原因附加给模型的上下文。\n\n### PostToolUse {#hi9FVzBqc}\n\n\n\* \*\*触发时机\*\*：工具调用实际执行完成后。\n\* \*\*Hook 的作用\*\*：校验执行结果或附加上下文。\n\* \*\*`matcher` 字段配置\*\*：可通过 `matcher` 字段配置正则表达式，从而匹配特定的工具名。\n\* \*\*`stdin`\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"PostToolUse\",\n \"tool\_use\_id\": \"toolcall-id-string\",\n \"tool\_name\": \"RunCommand\",\n \"llm\_tool\_name\": \"RunCommand\",\n \"tool\_input\": { ... },\n \"tool\_response\": { ... }\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 244,132,450 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`tool\_use\_id` |`string` |工具调用的唯一 ID。 |\n |`tool\_name` |`string` |标准化的工具名称。详见 [PreToolUse 和 PostToolUse 事件支持的工具](\u002Fide\u002Freference-for-hooks-configuration#hVL37mbtD)。 |\n |`llm\_tool\_name` |`string` |传递给大语言模型的原始工具名称。 |\n |`tool\_input` |`object` |工具输入参数。 |\n |`tool\_response` |`object` |工具调用的结果。 |\n\* \*\*`stdout`\*\*：\n ```JSON\n {\n \"decision\": \"block\",\n \"reason\": \"阻断原因\",\n \"hookSpecificOutput\": {\n \"hookEventName\": \"PostToolUse\",\n \"additionalContext\": \"附加给模型的上下文\"\n }\n }\n ```\n \u003C!-- @cols-width: 186,123,517 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`decision` |`string` |该字段仅支持设为 `block`。设置后，会向模型传递一条阻断信息，表示工具已执行且无法撤销。如需允许智能体继续处理工具调用的结果，将该字段留空。 |\n |`reason` |`string` |当 `decision` 字段的值为 `block` 时，此字段的内容将作为阻断原因展示给用户。否则，该字段将被忽略。 |\n |`additionalContext` |`string` |附加给模型的上下文文本。 |\n\* \*\*退出码\*\* \*\*`2` 的行为\*\*：将 `stderr` 传递给模型的上下文。\n\n### Stop {#hwn0daaUW}\n\n\n\* \*\*触发时机\*\*：智能体完成输出、准备结束当前查询时。此时，你可以检查智能体的输出是否达标；若不达标，可以阻止智能体结束任务并要求其继续处理。\n\* \*\*Hook 的作用\*\*：阻止智能体结束当前任务，并要求其继续执行。\n\* \*\*`stdin`\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"Stop\",\n \"stop\_hook\_active\": false,\n \"loop\_count\": 0, \n \"last\_assistant\_message\": \"大语言模型最终输出的文本内容\"\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 191,146,485 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`stop\_hook\_active` |`boolean` |当前查询是否已经被 `Stop` 事件的 Hook 至少阻断过一次。 |\n |`loop\_count` |`number` |当前查询的 `Stop` 事件被 Hook 阻断的次数计数。从 `0` 开始累加。 |\\\n | | | |\\\n | | |\*\*\*循环限制\*\*\*：你可以通过 `loop\_limit` 字段配置该 Hook 组允许阻断 `Stop` 事件的最大次数。当 `loop\_count` ≥ `loop\_limit` 时，该 Hook 组将被跳过，使智能体不再执行，以避免无限循环。`loop\_limit` 的默认值为 `5`。 |\n |`last\_assistant\_message` |`string` |大语言模型最终输出的文本内容。 |\n\* \*\*`stdout`\*\*：\n ```JSON\n {\n \"decision\": \"block\",\n \"reason\": \"请继续检查测试是否通过\"\n }\n ```\n \u003C!-- @cols-width: 133,123,530 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`decision` |`string` |该字段仅支持设为 `block`。设置后，将阻断智能体停止执行。如需让智能体停止执行，将该字段留空。 |\n |`reason` |`string` |当 `decision` 字段的值为 `block` 时，此字段的内容将作为新的用户请求让智能体继续执行。否则，该字段将被忽略。 |\n\* \*\*退出码\*\* \*\*`2` 的行为\*\*：等价于 `\"decision\": \"block\"`，阻断智能体停止执行，并将 `stderr` 作为新的用户请求让智能体继续执行。\n\* \*\*决策控制流程：\*\*\n `Stop` 事件的决策控制逻辑如下：\n ```Plain Text\n 智能体准备停止\n │\n ▼\n 检查 loop\_count 是否大于等于 loop\_limit？──── 是 ──► 跳过 Hook，允许智能体停止\n │\n 否\n │\n ▼\n 执行 Stop 事件的 Hook 脚本\n │\n ├── 退出码为 0，且 decision 字段为空 ───────► 允许停止\n │\n ├── 退出码为 0，且 decision 字段的值为 block ──► 阻断停止，将 reason 字段作为新 Query\n │\n ├── 退出码为 2 ───────────────────► 阻断停止，将 stderr 作为新 Query\n │\n └── 其他退出码 ───────────────────► 忽略错误，允许停止\n ``` \n\n\n### Notification {#hC6Vnzhd3}\n\n\n\* \*\*触发时机\*\*：智能体的工具调用等待用户确认时，或智能体完成任务时。该事件异步执行，不会阻塞智能体的主流程。\n\* \*\*Hook 的作用\*\*：发送通知，不改变智能体的执行流程。\n\* \*\*`matcher` 字段配置\*\*：基于通知类型（`notification\_type`）匹配，而不是基于工具名匹配。未配置 `matcher`，或将其配置为空字符串或 `\*` 时，表示匹配所有通知类型。\n\* \*\*stdin\*\*：\n ```JSON\n {\n \"session\_id\": \"...\",\n \"hook\_event\_name\": \"Notification\",\n \"notification\_type\": \"idle\_prompt\",\n \"message\": \"智能体已完成任务\",\n \"tool\_use\_id\": \"toolu\_xxx\"\n }\n ```\n 该事件的专有字段如下：\n \u003C!-- @cols-width: 161,110,571 --\u003E\n |\*\*字段\*\* |\*\*类型\*\* |\*\*描述\*\* |\n |---|---|---|\n |`notification\_type` |`string` |通知类别，用于标识通知场景，也用于匹配 `matcher` 字段的配置。可选值见下表。 |\n |`message` |`string` |通知的正文。 |\n |`tool\_use\_id` |`string?` |关联的工具调用 ID。 |\\\n | | | |\\\n | | |仅工具调用相关的通知类型携带该 ID，例如 `permission\_prompt`、`document\_review` 等。任务完成时发送的 `idle\_prompt` 类通知不携带该 ID。 |\n `notification\_type` 字段的值和相应触发时机如下：\n \u003C!-- @cols-width: 202,635 --\u003E\n |\*\*值\*\* |\*\*触发时机\*\* |\n |---|---|\n |`idle\_prompt` |智能体完成当前任务。 |\n |`permission\_prompt` |工具调用需要用户确认后才能继续执行，例如当 `PreToolUse` 事件的 Hook 返回 `ask` 决策，或工具本身需要手动确认时。 |\n |`document\_review` |Plan 或 Spec 工作流中的文档审阅流程。 |\n |`ask\_user\_question` |智能体需要用户补充信息时，进行提问的通知。 |\n |`browser\_interaction` |浏览器交互等待通知。 |\n\* \*\*`stdout`\*\*：该事件会忽略 Hook 进程的 `stdout` 输出。即使输出 JSON，也不会影响智能体的行为。\n\* \*\*退出码的行为\*\*：任意退出码均视为非阻断性结果。Hook 进程的 `stdout`、`stderr` 和退出码不会改变智能体的执行流程。\n\n## PreToolUse 和 PostToolUse 事件支持的工具 {#hVL37mbtD}\n\n在 `PreToolUse` 和 `PostToolUse` 事件中，你可以通过 `matcher` 字段匹配 `tool\_name`。\n\n`tool\_name` 为标准化工具名称，取值如下：\n\n\u003C!-- @cols-width: 147,290,396 --\u003E\n|\*\*分类\*\* |\*\*工具名称\*\* |\*\*描述\*\* |\n|---|---|---|\n|文件读取 |`Read` |读取文件内容。 |\n|文件写入 |`Write` |写入文件。 |\n|文件编辑 |`Edit` |单次查找并替换文件内容。 |\n|搜索 |`Glob` |基于文件路径模式进行匹配搜索。 |\n|^^| | | \\\n| |`Grep` |基于正则表达式进行内容搜索。 |\n|^^| | | \\\n| |`LS` |列出目录下的文件与子目录。 |\n|终端 |`RunCommand` |执行终端命令。 |\n|网络 |`WebSearch` |网络搜索。 |\n|^^| | | \\\n| |`WebFetch` |获取网页内容。 |\n|交互 |`AskUserQuestion` |向用户提问。 |\n|Skill |`Skill` |加载 Skill。 |\n|MCP |`mcp\_\_\u003CserverName\u003E\_\_\u003CtoolName\u003E` |MCP 工具。 |\\\n| | | |\\\n| | |\*\*MCP 工具匹配说明\*\*：在 Hook 中，MCP 工具的标准化名称格式为 `mcp\_\_\u003CserverName\u003E\_\_\u003CtoolName\u003E`（例如 `mcp\_\_Git\_\_iCube\_\_git\_status`）。你可以在 `matcher` 字段中使用 `mcp\_\_.\*` 来匹配所有 MCP 工具，或使用具体工具的名称进行精确匹配。 |\n\n## 示例 {#hsw0pL8zc}\n\n### \*\*会话开始时，注入项目上下文\*\* {#hkmiH25S6}\n\n本示例用于在会话启动时自动注入项目级上下文和环境变量，使智能体在开始处理任务前即可获取项目名称、运行环境、技术栈和代码规范等信息。\n\n\*\*Hook 配置\*\*：监听 `SessionStart` 事件，并在事件触发时执行 `setup\_env.sh` 脚本。\n\n::::tabs\n@tab macOS \u002F Linux\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"SessionStart\": [\n {\n \"hooks\": [\n {\n \"command\": \"bash .\u002Fscripts\u002Fsetup\_env.sh\"\n }\n ]\n }\n ]\n }\n}\n```\n\n@tab Windows\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"SessionStart\": [\n {\n \"hooks\": [\n {\n \"command\": \"powershell -ExecutionPolicy Bypass -File .\u002Fscripts\u002Fsetup\_env.ps1\"\n }\n ]\n }\n ]\n }\n}\n```\n\n\n::::\n\n\*\*`setup\_env.sh` 脚本示例\*\*：该脚本会向 `$TRAE\_ENV\_FILE` 写入环境变量，使其在后续 Hook 和 `RunCommand` 工具调用中生效；同时通过标准输出向模型补充项目背景信息。\n\n::::tabs\n@tab macOS \u002F Linux\n```Bash\n#!\u002Fbin\u002Fbash\n# 向环境变量文件写入项目配置\necho \"export PROJECT\_NAME=my-app\" \u003E\u003E \"$TRAE\_ENV\_FILE\"\necho \"export NODE\_ENV=development\" \u003E\u003E \"$TRAE\_ENV\_FILE\"\n\n# 输出上下文信息给模型\necho \"当前项目：my-app，技术栈：React + TypeScript，请遵循 ESLint 规范。\"\n```\n\n@tab Windows\n```PowerShell\n# 向环境变量文件写入项目配置\nAdd-Content -Path $env:TRAE\_ENV\_FILE -Value \"`$env:PROJECT\_NAME='my-app'\"\nAdd-Content -Path $env:TRAE\_ENV\_FILE -Value \"`$env:NODE\_ENV='development'\"\n\n# 输出上下文信息给模型\nWrite-Output \"当前项目：my-app，技术栈：React + TypeScript，请遵循 ESLint 规范。\"\n```\n::::\n\n### \*\*终端命令执行前，拦截高风险操作\*\* {#hktTsMSHA}\n\n本示例用于在终端命令真正执行前识别并拦截高风险操作，降低误删文件、执行破坏性命令或提交危险数据库操作的风险。\n\n\*\*Hook 配置\*\*：监听 `PreToolUse` 事件，并通过 `matcher` 仅匹配 `RunCommand` 工具。只有当智能体准备执行终端命令时，才会触发该 Hook。\n\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"PreToolUse\": [\n {\n \"matcher\": \"RunCommand\",\n \"hooks\": [\n {\n \"type\": \"command\",\n \"command\": \"python3 .\u002Fvalidate\_command.py\",\n \"timeout\": 10\n }\n ]\n }\n ]\n }\n}\n```\n\n\*\*`validate\_command.py` 脚本示例\*\*：该脚本从 `stdin` 读取工具输入，提取待执行命令，并检查命令内容是否包含预设的危险模式。若命中危险模式，脚本返回 `\"permissionDecision\": \"deny\"` 和拒绝原因，从而阻止该命令执行；若未命中，则正常退出并允许继续执行。\n\n```Python\n#!\u002Fusr\u002Fbin\u002Fenv python3\nimport sys, json\n\ninput\_data = json.load(sys.stdin)\ncommand = input\_data.get(\"tool\_input\", {}).get(\"command\", \"\")\n\ndangerous\_patterns = [\"rm -rf \u002F\", \"DROP TABLE\", \"format C:\"]\nfor pattern in dangerous\_patterns:\n if pattern in command:\n result = {\n \"hookSpecificOutput\": {\n \"hookEventName\": \"PreToolUse\",\n \"permissionDecision\": \"deny\",\n \"permissionDecisionReason\": f\"high risk command detected: {pattern}\"\n }\n }\n json.dump(result, sys.stdout)\n sys.exit(0)\n\n# 允许执行\nsys.exit(0)\n```\n\n### 任务结束前，自动\*\*运行验收测试\*\* {#hQPwXC4Db}\n\n本示例用于在智能体准备结束当前任务前自动执行验收测试，并根据测试结果决定是否允许停止。如果测试未通过，Hook 会要求智能体继续修复问题，而不是直接结束任务。\n\n:::tip 提示\n如需测试本示例，配置完成后，可向智能体发送消息 “测试 stop hook” 来验证效果。\n:::\n\n\*\*Hook 配置\*\*：监听 `Stop` 事件，并设置 `loop\_limit` 限制最多阻断次数，避免测试持续失败时造成无限循环。\n\n::::tabs\n@tab macOS \u002F Linux\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"Stop\": [\n {\n \"loop\_limit\": 3,\n \"hooks\": [\n {\n \"command\": \"python3 .\u002Fcheck\_tests.py\",\n \"timeout\": 60\n }\n ]\n }\n ]\n }\n}\n```\n\n@tab Windows\n```JSON\n{\n \"version\": 1,\n \"hooks\": {\n \"Stop\": [\n {\n \"loop\_limit\": 3,\n \"hooks\": [\n {\n \"command\": \"python .\u002Fcheck\_tests.py\", \u002F\u002F 或使用 py .\u002Fcheck\_tests.py 命令\n \"timeout\": 60\n }\n ]\n }\n ]\n }\n}\n```\n::::\n\n\*\*`check\_tests.py` 脚本示例\*\*：该脚本会运行 `npm test` 并读取测试结果。若测试失败，该脚本返回 `\"decision\": \"block\"` 和失败原因，并带上当前阻断次数，要求智能体继续修复；若测试通过，则正常退出并允许智能体停止。\n\n```Python\n#!\u002Fusr\u002Fbin\u002Fenv python3\nimport sys, json, subprocess\n\ninput\_data = json.load(sys.stdin)\nloop\_count = input\_data.get(\"loop\_count\", 0)\n\n# 运行测试\nresult = subprocess.run([\"npm\", \"test\"], capture\_output=True, text=True)\n\nif result.returncode != 0:\n output = {\n \"decision\": \"block\",\n \"reason\": f\"测试未通过（第 {loop\_count + 1} 次检查），请修复以下失败:\\n{result.stdout[-500:]}\"\n }\n json.dump(output, sys.stdout)\nelse:\n # 测试通过，允许停止\n sys.exit(0)\n```\n","type":"doc","meta":{"description":"本文档详细介绍了TRAE IDE中Hook的配置方式，涵盖配置文件位置，包括全局Hook和项目Hook在不同操作系统中的存储路径，还阐述了Hook配置格式及各字段说明，如顶层结构、事件层、Hook组层和Hook定义层的相关字段，助您深入了解Hook配置。","keywords":["TRAE IDE","Hook配置","配置文件位置","配置格式","字段说明"]},"created\_at":"2026-06-26T07:39:33.897Z","updated\_at":"2026-06-26T07:39:33.897Z"},"tabs":[{"\_id":"67a5b43a9ae5aa03545c7a07","name":"TRAE IDE","doc\_path":"ide\_trae-overview","sort":1738912826317000},{"\_id":"69ae930b9e3a5d0550e655c6","name":"TRAE Work","doc\_path":"work\_what-is-trae-solo","sort":1742260835606000},{"\_id":"67f399815eb9ea04ed5a0dc2","name":"TRAE 插件","doc\_path":"plugin\_what-is-trae-plugin","sort":1744017793008000},{"\_id":"69393503cb3f7404dd1ba797","name":"TRAE CLI","doc\_path":"cli\_what-is-trae-cli","sort":1765356803650000},{"\_id":"6a56350b17d05701c37b7df4","name":"企业版","doc\_path":null,"type":"group","sort":1777277513227100},{"\_id":"69ef1a491b2d8604fb497803","name":"用户指南","doc\_path":"enterprise\_trae-enterprise-edition-overview","parent\_id":"6a56350b17d05701c37b7df4","sort":1784034631531900},{"\_id":"6a56354717d05701c37b7e45","name":"API 参考","doc\_path":"enterprise\_trae-cn-enterprise-api","parent\_id":"6a56350b17d05701c37b7df4","type":"common","sort":1784034631532000}],"menus":[{"\_id":"6a4dc0de4bdbc784e33c6fec","doc\_release\_id":"6a587c483d87c401e4c3f5e4","hidden":false,"parent\_id":null,"path":"ide\_trae-overview","sort":1780912445574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE 概览"},{"\_id":"6a27b7bf4bdbc784e337fba3","doc\_release\_id":"6a69bb5c31547d01b9f85ac7","hidden":false,"parent\_id":null,"path":"ide\_trae-solo-is-now-available","sort":1780949588013500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重磅更新：TRAE Work 客户端上线"},{"\_id":"6a27b7bf4bdbc784e337fbaf","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730457000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"入门"},{"\_id":"6a27b7bf4bdbc784e337fbc2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730462000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"教程 & 最佳实践"},{"\_id":"6a66d8394bdbc784e314a365","hidden":false,"parent\_id":null,"path":null,"sort":1780986730469000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"最新动态","doc\_release\_id":null},{"\_id":"6a27b7bf4bdbc784e337fbc6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730476000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程核心"},{"\_id":"6a27b7bf4bdbc784e337fbf2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730477000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式"},{"\_id":"6a27b7bf4bdbc784e337fbf6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730479000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具与插件"},{"\_id":"6a27b7bf4bdbc784e337fc12","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730486000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作环境"},{"\_id":"6a27b7bf4bdbc784e337fc22","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730491000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置"},{"\_id":"6a27b7bf4bdbc784e337fc26","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730492000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益"},{"\_id":"6a27b7bf4bdbc784e337fc54","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730503000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"问题排查"},{"\_id":"6a27b7bf4bdbc784e337fc5b","doc\_release\_id":"6a394f1addf14401b2a89a64","hidden":false,"parent\_id":null,"path":"ide\_contact-us","sort":1780986730507000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"联系我们"},{"\_id":"6a27b7bf4bdbc784e337fc61","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730508000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"相关协议"},{"\_id":"6a27b7bf4bdbc784e337fbb3","doc\_release\_id":"6a57252ad0270601e250743f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_what-is-trae","sort":1780986730455000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"什么是 TRAE IDE？"},{"\_id":"6a27b7bf4bdbc784e337fbb7","doc\_release\_id":"6a60bfded0dfed01aa9be4ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_get-started-with-trae","sort":1780986730458000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快速开始"},{"\_id":"6a27b7bf4bdbc784e337fbba","doc\_release\_id":"6a2a99737d55f901e2b4b294","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_device-limit","sort":1780986730459000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"设备数量限制"},{"\_id":"6a27b7bf4bdbc784e337fbbe","doc\_release\_id":"6a63745a6c585801d078a7c2","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_changelog","sort":1780986730461000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"更新日志"},{"\_id":"6a27b7bf4bdbc784e337fba5","doc\_release\_id":"6a435d8142bb2101b15d8c07","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_trae-editor-for-unity-tutorial","sort":1780986730509900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE Editor for Unity：让 AI 融入 Unity 开发工作流"},{"\_id":"6a27b7bf4bdbc784e337fc68","doc\_release\_id":"6a2a99737d55f901e2b4b2ae","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_top-10-recommended-skills-for-development-scenarios","sort":1780986730510000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"研发场景十大热门 Skill 推荐"},{"\_id":"6a27b7bf4bdbc784e337fc70","doc\_release\_id":"6a2a99737d55f901e2b4b2b0","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_best-practice-for-how-to-write-a-good-skill","sort":1780986730512000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"如何写好一个 Skill：从创建到迭代的最佳实践"},{"\_id":"6a27b7bf4bdbc784e337fc73","doc\_release\_id":"6a2a99737d55f901e2b4b2b1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_most-used-mcp-servers-in-trae","sort":1780986730513000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"热门 MCP Server 详解"},{"\_id":"6a27b7bf4bdbc784e337fc7d","doc\_release\_id":"6a2a99737d55f901e2b4b2b3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_custom-agents-ready-for-one-click-import","sort":1780986730516000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"支持一键导入的自定义智能体"},{"\_id":"6a27b7bf4bdbc784e337fc80","doc\_release\_id":"6a2a99737d55f901e2b4b2b4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_ai-coding-case-streams-to-river","sort":1780986730517000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程实践：“积流成江” 的开发故事"},{"\_id":"6a27b7bf4bdbc784e337fc84","doc\_release\_id":"6a2a99737d55f901e2b4b2b5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-figma","sort":1780986730518000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：将 Figma 设计稿转化为前端代码"},{"\_id":"6a27b7bf4bdbc784e337fca2","doc\_release\_id":"6a2a99737d55f901e2b4b2bb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-playwright","sort":1780986730526000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：实现网页自动化测试"},{"\_id":"6a27b7bf4bdbc784e337fca5","doc\_release\_id":"6a2a99737d55f901e2b4b2bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-amap","sort":1780986730527000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：使用高德地图 MCP Server 规划行程"},{"\_id":"6a27b7bf4bdbc784e337fbc9","doc\_release\_id":"6a30083104efdb01aa0e3acb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_chat","sort":1780986730463000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"对话"},{"\_id":"6a27b7bf4bdbc784e337fbcd","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730464000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型"},{"\_id":"6a27b7bf4bdbc784e337fbd3","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730466000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文"},{"\_id":"6a27b7bf4bdbc784e337fbd6","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730467000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体（Agent）"},{"\_id":"6a27b7bf4bdbc784e337fbd9","doc\_release\_id":"6a43adb274518b01bb2b602d","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_skills","sort":1780986730468000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"技能（Skill）"},{"\_id":"6a27b7bf4bdbc784e337fbdf","doc\_release\_id":"6a2a99737d55f901e2b4b298","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_rules","sort":1780986730470000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"规则（Rule）"},{"\_id":"6a27b7bf4bdbc784e337fbe2","doc\_release\_id":"6a43843cb81ed601bad58c35","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_memories","sort":1780986730471000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"记忆"},{"\_id":"6a27b7bf4bdbc784e337fbe7","doc\_release\_id":"6a435d9695138601b04b1aa9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_slash-commands","sort":1780986730472000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"命令"},{"\_id":"6a2bed994bdbc784e3b39779","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"钩子（Hook）"},{"\_id":"6a27b7bf4bdbc784e337fbec","doc\_release\_id":"6a2a99737d55f901e2b4b29b","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_cue","sort":1780986730473250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"超级代码补全：CUE"},{"\_id":"6a6701dd4bdbc784e31fe0f1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473375,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批","doc\_release\_id":null},{"\_id":"6a435cb64bdbc784e33d8105","doc\_release\_id":"6a6067cee1be3e01a9085e57","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_spec-and-plan-workflows","sort":1780986730473500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置工作流：Plan、Spec 与 Goal"},{"\_id":"6a5e13b84bdbc784e379d139","doc\_release\_id":"6a5e173544d11701b082c1f7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_browser-use","sort":1780986730474250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"浏览器控制"},{"\_id":"6a27b7bf4bdbc784e337fbee","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730475000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"代码质量"},{"\_id":"6a27b7bf4bdbc784e337fc04","doc\_release\_id":"6a5995bc6d002301b9c31436","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_models","sort":1780986730482000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置模型 & 自定义模型"},{"\_id":"6a27b7bf4bdbc784e337fd07","doc\_release\_id":"6a599631cb530701b9ea62d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_auto-mode","sort":1780986730555000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Auto 模式"},{"\_id":"6a27b7bf4bdbc784e337fc88","doc\_release\_id":"6a2a99737d55f901e2b4b2b6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_basic-usage-of-context","sort":1780986730520000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"基础用法"},{"\_id":"6a27b7bf4bdbc784e337fc96","doc\_release\_id":"6a2a99737d55f901e2b4b2b8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_number-sign","sort":1780986730523000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 # 符号引用上下文"},{"\_id":"6a27b7bf4bdbc784e337fc99","doc\_release\_id":"6a2a99737d55f901e2b4b2b9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_codebase-indexing","sort":1780986730524000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作区代码索引"},{"\_id":"6a27b7bf4bdbc784e337fc9f","doc\_release\_id":"6a2a99737d55f901e2b4b2ba","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_ignore-files","sort":1780986730525000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"忽略文件"},{"\_id":"6a27b7bf4bdbc784e337fd24","doc\_release\_id":"6a2a9d567d55f901e2b4b7ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_context-compaction","sort":1780986730562000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文压缩"},{"\_id":"6a27b7bf4bdbc784e337fcfb","doc\_release\_id":"6a435dc03e465301b37694fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent-overview","sort":1780986730551000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体概述"},{"\_id":"6a27b7bf4bdbc784e337fd11","doc\_release\_id":"6a69e3f71eefd201b2ba0e7f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_built-in-agent","sort":1780986730552000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置智能体：Agent"},{"\_id":"6a27b7bf4bdbc784e337fd00","doc\_release\_id":"6a4e00bf8a804d01b3e42035","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent","sort":1780986730553000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"创建并管理自定义智能体"},{"\_id":"6a3be0874bdbc784e3da357d","doc\_release\_id":"6a435cac3e465301b3769451","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_subagents","sort":1780986730553500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"子智能体（Subagent）"},{"\_id":"6a27b7bf4bdbc784e337fd04","doc\_release\_id":"6a3a2f8818b37b01bc6660ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_auto-run-and-security","sort":1780986730554000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自动运行 & 安全性"},{"\_id":"6a27b7bf4bdbc784e337fd97","doc\_release\_id":"6a2a99737d55f901e2b4b2f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_agent-powered-code-review","sort":1780986730594000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能代码审查"},{"\_id":"6a27b7bf4bdbc784e337fd9a","doc\_release\_id":"6a2a99737d55f901e2b4b2f5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_refactoring-insights","sort":1780986730596000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重构洞察"},{"\_id":"6a27b7bf4bdbc784e337fd0d","doc\_release\_id":"6a435ccf3e465301b3769497","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_solo-mode","sort":1780986730557000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式概览"},{"\_id":"6a27b7bf4bdbc784e337fd18","doc\_release\_id":"6a2a99737d55f901e2b4b2d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_task-management","sort":1780986730559000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"多任务并行"},{"\_id":"6a27b7bf4bdbc784e337fd1b","doc\_release\_id":"6a435cdb42bb2101b15d8bca","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_tool-panel","sort":1780986730560000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具面板"},{"\_id":"6a27b7bf4bdbc784e337fd21","doc\_release\_id":"6a2a99737d55f901e2b4b2d7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_figma-to-code","sort":1780986730561000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Figma 设计还原"},{"\_id":"6a27b7bf4bdbc784e337fc8c","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":null,"sort":1780986730521000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型上下文协议（MCP）"},{"\_id":"6a27b7bf4bdbc784e337fc90","doc\_release\_id":"6a2a99737d55f901e2b4b2b7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":"ide\_manage-extensions","sort":1780986730522000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"插件"},{"\_id":"6a27b7bf4bdbc784e337fc16","doc\_release\_id":"6a2beedc73064f01baed0009","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_wsl","sort":1780986730487000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 WSL 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1b","doc\_release\_id":"6a2beefce1e9a201bbc6b5fc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_ssh-remote","sort":1780986730488000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 SSH 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1e","doc\_release\_id":"6a69cae41eefd201b2b9fd3e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_sandbox","sort":1780986730490000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"(Legacy) 沙箱"},{"\_id":"6a27b7bf4bdbc784e337fc2a","doc\_release\_id":"6a2a99737d55f901e2b4b2a3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_ide-settings","sort":1780986730493000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置总览"},{"\_id":"6a27b7bf4bdbc784e337fc2d","doc\_release\_id":"6a2a99737d55f901e2b4b2a4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_keyboard-shortcuts","sort":1780986730494000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快捷键"},{"\_id":"6a27b7bf4bdbc784e337fc32","doc\_release\_id":"6a2a99737d55f901e2b4b2a5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_source-control","sort":1780986730496000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"源代码管理"},{"\_id":"6a27b7bf4bdbc784e337fc36","doc\_release\_id":"6a2a99737d55f901e2b4b2a6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_mark-for-ai-use","sort":1780986730497000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"终端：标记为 AI 使用"},{"\_id":"6a27b7bf4bdbc784e337fc3c","doc\_release\_id":"6a2a99737d55f901e2b4b2a7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_resource-explorer","sort":1780986730498000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"进程资源管理器"},{"\_id":"6a27b7bf4bdbc784e337fc40","doc\_release\_id":"6a2a99737d55f901e2b4b2a8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_privacy-mode","sort":1780986730499000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"隐私模式"},{"\_id":"6a27b7bf4bdbc784e337fda7","doc\_release\_id":"6a3fc9e7c078e201ba51b2aa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_fast-pass-overview","sort":1780986730600000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益概览"},{"\_id":"6a27b7bf4bdbc784e337fdac","doc\_release\_id":"6a4747342877b801c43145bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_susbcription-management","sort":1780986730601000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"管理 “速通” 权益订阅"},{"\_id":"6a27b7bf4bdbc784e337fdb0","doc\_release\_id":"6a2aa42a76fca701e31edf80","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_use-fast-pass","sort":1780986730603000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 “速通“ 权益"},{"\_id":"6a27b7bf4bdbc784e337fdb3","doc\_release\_id":"6a2a99737d55f901e2b4b2fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_confirmation-letter-for-vat-general-invoices","sort":1780986730604000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"增值税普通发票确认书"},{"\_id":"6a27b7bf4bdbc784e337fd28","doc\_release\_id":"6a4334713e465301b376912e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_get-logs-or-session-id","sort":1780986730563000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"获取日志或 SessionID"},{"\_id":"6a27b7bf4bdbc784e337fd2c","doc\_release\_id":"6a2a99737d55f901e2b4b2da","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-general-issues","sort":1780986730564000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"常规问题"},{"\_id":"6a27b7bf4bdbc784e337fd30","doc\_release\_id":"6a2a99737d55f901e2b4b2db","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_error-codes","sort":1780986730565000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"错误码"},{"\_id":"6a27b7bf4bdbc784e337fd33","doc\_release\_id":"6a2a99737d55f901e2b4b2dc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_prigramming-languages-related","sort":1780986730566000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"编程语言相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd37","doc\_release\_id":"6a2a99737d55f901e2b4b2dd","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-mcp-server-related-issues","sort":1780986730567000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd51","doc\_release\_id":"6a2a99737d55f901e2b4b2e4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-remote-ssh-related-issues","sort":1780986730574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Remote SSH 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd7b","doc\_release\_id":"6a2a99737d55f901e2b4b2ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-performance-issues","sort":1780986730586000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"性能问题"},{"\_id":"6a27b7bf4bdbc784e337fcf4","doc\_release\_id":"6a340e5b620bf701bbe02508","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_open-source-software-notice","sort":1780986730549000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"开源软件声明"},{"\_id":"6a27b7bf4bdbc784e337fcf7","doc\_release\_id":"6a2a99737d55f901e2b4b2ce","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_intro-to-llm","sort":1780986730550000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"豆包大模型备案公示"},{"\_id":"6a27b7bf4bdbc784e337fd57","doc\_release\_id":"6a2a99737d55f901e2b4b2e5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_model-context-protocol","sort":1780986730575000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 概览"},{"\_id":"6a27b7bf4bdbc784e337fd5a","doc\_release\_id":"6a2a99737d55f901e2b4b2e6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_add-mcp-servers","sort":1780986730576000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"添加 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd5e","doc\_release\_id":"6a2aa13b7d55f901e2b4b8f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_mcp-server-install-links","sort":1780986730578000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 安装链接"},{"\_id":"6a27b7bf4bdbc784e337fd63","doc\_release\_id":"6a2a99737d55f901e2b4b2e8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_use-mcp-servers-in-agents","sort":1780986730579000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"在智能体中使用 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd66","doc\_release\_id":"6a2a99737d55f901e2b4b2e9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_check-mcp-server-logs","sort":1780986730580000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"查看 MCP Server 的日志"},{"\_id":"6a2bed994bdbc784e3b39784","doc\_release\_id":"6a2bed9904efdb01aa0bf262","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_automate-actions-with-hooks","sort":1780986730598000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 Hook 实现自动化"},{"\_id":"6a2bed9d4bdbc784e3b39872","doc\_release\_id":"6a3e2cb5d6149c01ba317774","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_hook-configuration-reference","sort":1781165376289000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Hook 配置详解"},{"\_id":"6a66d8494bdbc784e314a6b6","doc\_release\_id":"6a6709d9baafae01bdda06f2","hidden":false,"parent\_id":"6a66d8394bdbc784e314a365","path":"ide\_coming-soon","sort":1785124921280900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"即将上线：以积分为基础的计费模式"},{"\_id":"6a69ca9b4bdbc784e3dde75b","doc\_release\_id":"6a69df1db0d56301bade22ae","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_permission-and-approval","sort":1785135581001000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批概览"},{"\_id":"6a69caa44bdbc784e3ddea56","doc\_release\_id":"6a69cdfab0d56301bade185a","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-permission-mode-configuration-reference","sort":1785135581001100,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义权限模式配置参考"},{"\_id":"6a69cab04bdbc784e3ddeee2","doc\_release\_id":"6a69cab01eefd201b2b9fcb7","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-global-permission-configuration-reference","sort":1785157495167000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义全局权限配置参考"}],"site":{"\_id":"6a27b21694049701b9d125e0","name":"TRAE","icon":"https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Ff5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png","logo\_link":"https:\u002F\u002Fwww.trae.cn\u002F","custom\_domain":{"domains":["docs.trae.cn"],"domain\_path":"\u002F"},"seo":{"googleMetaKey":"Djn\_d63iCka07pN3cVhp3GJBTa8yKbmOkvLf45CuD6k","bingMetaKey":"","baiduMetaKey":"codeva-6r8UBfgVA4"},"rag":{"enable":true,"knowledge":{"scope":"all"},"rules":{"model":4,"prompt":"# 角色\n你是 TRAE 文档问答助手，仅基于检索到的官方文档片段回答用户问题。\n\n# 核心准则\n1. 严格依据文档作答。文档未涵盖的内容直接说\"未在文档中找到相关说明\"，不要补充、不要推测。\n2. 文档片段相互矛盾时，优先采用更新时间较近的版本，并提示用户\"文档中存在不同表述，建议核对最新版本\"。\n\n# 边界\n- 用户追问与文档无关的内容时，礼貌引导回到文档主题。\n- 不臆测产品路线图、未发布功能、价格政策细节。\n- 不与用户争辩；用户质疑回答时，重新检索并诚实说明依据。","count":10,"questions":["TRAE IDE 里最热门的 Skill 是哪些？","如何创建自定义智能体？","如何配置 Rules？"],"welcome":{"title":"TRAE 智能问答助手","content":"你好，我是 TRAE 文档问答助手 🎉\n你在阅读当前文档的过程中，无论对文档概念的解释，还是文档内容方面的疑问，都可以随时向我提问，我会全力为你解答"},"fallback":"抱歉，未在文档中找到相关说明"}},"feedback":{"enable":true}}}}},"errors":null}
