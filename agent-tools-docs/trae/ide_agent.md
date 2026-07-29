# trae / ide_agent

> Source: https://docs.trae.cn/ide_agent
> Fetched: 2026-07-29 20:24:39

---

创建并管理自定义智能体(()=>{"use strict";var e,t,r,a,n,o,c,f,i={},d={};function l(e){var t=d[e];if(void 0!==t)return t.exports;var r=d[e]={exports:{}};return i[e].call(r.exports,r,r.exports,l),r.exports}if(l.m=i,l.n=e=>{var t=e&&e.\_\_esModule?()=>e.default:()=>e;return l.d(t,{a:t}),t},t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.\_\_proto\_\_,l.t=function(r,a){if(1&a&&(r=this(r)),8&a||"object"==typeof r&&r&&(4&a&&r.\_\_esModule||16&a&&"function"==typeof r.then))return r;var n=Object.create(null);l.r(n);var o={};e=e||[null,t({}),t([]),t(t)];for(var c=2&a&&r;("object"==typeof c||"function"==typeof c)&&!~e.indexOf(c);c=t(c))Object.getOwnPropertyNames(c).forEach(e=>{o[e]=()=>r[e]});return o.default=()=>r,l.d(n,o),n},l.d=(e,t)=>{for(var r in t)l.o(t,r)&&!l.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},l.f={},l.e=e=>Promise.all(Object.keys(l.f).reduce((t,r)=>(l.f[r](e,t),t),[])),l.u=e=>"static/js/async/"+({3234:"$",3313:"rag-widget",7807:"page"}[e]||e)+"."+{1032:"073ab03092",1093:"bea355c233",1162:"a2a9bd66ae",1207:"3f46ff7cea",1593:"f31179547b",1684:"2206314498",1689:"58fa40011d",183:"262384895c",1904:"5352aaf52d",1951:"f96298c6ae",1982:"412f609917",2180:"0fc77cf40c",2217:"f1be737b30",2703:"81b4be462c",2881:"14da83890c",3051:"5b8c9d25df",3157:"0bfac25da0",3234:"585a3f9198",3313:"023f1758d4",3500:"4663638c8d",3546:"37c5bced1e",3655:"562dcf22c3",3762:"89704f37a4",3985:"18974aa871",4020:"6ce4fa5b90",4097:"e90f0f2e7e",4171:"c9c86f7365",4310:"85b9099685",4316:"8d538c6be5",4526:"4767866220",460:"2973c28996",4604:"38511a7a33",4852:"e0234af886",4939:"80da571abe",503:"65cfe70275",5048:"60c3f9ea43",5396:"0be21ebdbc",5448:"06a6aeb469",5976:"c185faf589",609:"f1c471c143",6244:"adfc21bbf4",6562:"66393eebe9",6812:"ec46ff09a1",6851:"23d437c033",7367:"419a6b4240",7415:"2ee686629d",7558:"cfb7484405",7661:"4fb258de13",7756:"25c2bba752",7807:"d38bc8c689",7985:"79d04a715f",8547:"b37216d61f",8567:"197996a954",8579:"6a2c97a2db",8658:"58c1b0b296",8662:"b6d9df9408",8796:"f14c9a434a",8850:"dec5910a00",8880:"f5169d0ffa",9024:"c8f7837d89",9150:"a11152606a",9285:"d3e815b975",958:"f2fe0d9984",9735:"583d7ab809",9790:"69b86c9e8a",9865:"b6fdd8a42a",9879:"5b0db3af4f",9922:"7b2c65e80a"}[e]+".js",l.miniCssF=e=>"static/css/async/"+({3313:"rag-widget",7807:"page"}[e]||e)+"."+{3313:"6b79098a88",7756:"ddb1faeff0",7807:"7da9e47967"}[e]+".css",l.g=(()=>{if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}})(),l.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r={},a="@topic/renderer:",l.l=function(e,t,n,o){if(r[e])r[e].push(t);else{if(void 0!==n)for(var c,f,i=document.getElementsByTagName("script"),d=0;d<i.length;d++){var u=i[d];if(u.getAttribute("src")==e||u.getAttribute("data-rspack")==a+n){c=u;break}}c||(f=!0,(c=document.createElement("script")).timeout=120,l.nc&&c.setAttribute("nonce",l.nc),c.setAttribute("data-rspack",a+n),c.src=e),r[e]=[t];var s=function(t,a){c.onerror=c.onload=null,clearTimeout(b);var n=r[e];if(delete r[e],c.parentNode&&c.parentNode.removeChild(c),n&&n.forEach(function(e){return e(a)}),t)return t(a)},b=setTimeout(s.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=s.bind(null,c.onerror),c.onload=s.bind(null,c.onload),f&&document.head.appendChild(c)}},l.r=e=>{"u">typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"\_\_esModule",{value:!0})},l.nmd=e=>(e.paths=[],e.children||(e.children=[]),e),n=[],l.O=(e,t,r,a)=>{if(!t){var o=1/0;for(d=0;d<n.length;d++){for(var[t,r,a]=n[d],c=!0,f=0;f<t.length;f++)(!1&a||o>=a)&&Object.keys(l.O).every(e=>l.O[e](t[f]))?t.splice(f--,1):(c=!1,a<o&&(o=a));if(c){n.splice(d--,1);var i=r();void 0!==i&&(e=i)}}return e}a=a||0;for(var d=n.length;d>0&&n[d-1][2]>a;d--)n[d]=n[d-1];n[d]=[t,r,a]},l.p="//lf-arcosite.bytecdn.com/obj/arcosites/topic-cdn-1/","u">typeof document){var u={6408:0};l.f.miniCss=function(e,t){u[e]?t.push(u[e]):0!==u[e]&&{3313:1,7756:1,7807:1}[e]&&t.push(u[e]=new Promise(function(t,r){var a=l.miniCssF(e),n=l.p+a;if(function(e,t){for(var r=document.getElementsByTagName("link"),a=0;a<r.length;a++)if((c=(o=r[a]).getAttribute("data-href")||o.getAttribute("href"))&&(c=c.split("?")[0]),"stylesheet"===o.rel&&(c===e||c===t))return o;var n=document.getElementsByTagName("style");for(a=0;a<n.length;a++){var o,c;if((c=(o=n[a]).getAttribute("data-href"))===e||c===t)return o}}(a,n))return t();!function(e,t,r,a,n){var o=document.createElement("link");o.rel="stylesheet",o.type="text/css",l.nc&&(o.nonce=l.nc),o.href=t,o.onerror=o.onload=function(r){if(o.onerror=o.onload=null,"load"===r.type)a();else{var c=r&&("load"===r.type?"missing":r.type),f=r&&r.target&&r.target.href||t,i=Error("Loading CSS chunk "+e+" failed.\\n("+f+")");i.code="CSS\_CHUNK\_LOAD\_FAILED",i.type=c,i.request=f,o.parentNode&&o.parentNode.removeChild(o),n(i)}},r?r.parentNode.insertBefore(o,r.nextSibling):document.head.appendChild(o)}(e,n,null,t,r)}).then(function(){u[e]=0},function(t){throw delete u[e],t}))}}o={6408:0},l.f.j=function(e,t){var r=l.o(o,e)?o[e]:void 0;if(0!==r)if(r)t.push(r[2]);else if(6408!=e){var a=new Promise((t,a)=>r=o[e]=[t,a]);t.push(r[2]=a);var n=l.p+l.u(e),c=Error();l.l(n,function(t){if(l.o(o,e)&&(0!==(r=o[e])&&(o[e]=void 0),r)){var a=t&&("load"===t.type?"missing":t.type),n=t&&t.target&&t.target.src;c.message="Loading chunk "+e+" failed.\n("+a+": "+n+")",c.name="ChunkLoadError",c.type=a,c.request=n,r[1](c)}},"chunk-"+e,e)}else o[e]=0},l.O.j=e=>0===o[e],c=(e,t)=>{var r,a,[n,c,f]=t,i=0;if(n.some(e=>0!==o[e])){for(r in c)l.o(c,r)&&(l.m[r]=c[r]);if(f)var d=f(l)}for(e&&e(t);i<n.length;i++)a=n[i],l.o(o,a)&&o[a]&&o[a][0](),o[a]=0;return l.O(d)},(f=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_||[]).forEach(c.bind(null,0)),f.push=c.bind(null,f.push.bind(f))})()
;(function(){
window.\_MODERNJS\_ROUTE\_MANIFEST = {"routeAssets":{"$":{"chunkIds":["6493","7756","7807","3234"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js","static/js/async/$.585a3f9198.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"main":{"chunkIds":["6408","6493","9783","9535","44","1889"],"assets":["static/js/lib-polyfill.378681f845.js","static/js/lib-react.27fe10ca75.js","static/js/lib-router.89b6789ef8.js","static/js/44.2384edeb97.js","static/js/main.29e80207a7.js","static/css/main.0a4ac522c6.css"],"referenceCssAssets":["static/css/main.0a4ac522c6.css"]},"page":{"chunkIds":["6493","7756","7807"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"rag-widget":{"chunkIds":["9150","3313"],"assets":["static/js/async/9150.a11152606a.js","static/js/async/rag-widget.023f1758d4.js","static/css/async/rag-widget.6b79098a88.css"],"referenceCssAssets":["static/css/async/rag-widget.6b79098a88.css"]}}};
})();
!function(n,t){if(n.LogAnalyticsObject=t,!n[t]){function c(){c.q.push(arguments)}c.q=c.q||[],n[t]=c}n[t].l=+new Date}(window,"collectEvent") 

[![TRAE](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png)

TRAE](https://www.trae.cn/)

[TRAE IDE](/ide_trae-overview)[TRAE Work](/work_what-is-trae-solo)[TRAE 插件](/plugin_what-is-trae-plugin)[TRAE CLI](/cli_what-is-trae-cli)[企业版](/ide_agent)

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

[智能体概述](/ide_agent-overview)

[内置智能体：Agent](/ide_built-in-agent)

[创建并管理自定义智能体](/ide_agent)

[子智能体（Subagent）](/ide_subagents)

[自动运行 & 安全性](/ide_auto-run-and-security)

[技能（Skill）](/ide_skills)

[规则（Rule）](/ide_rules)

[记忆](/ide_memories)

[命令](/ide_slash-commands)

钩子（Hook）

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

AI 编程核心/智能体（Agent）/创建并管理自定义智能体

# 创建并管理自定义智能体

你可以在 TRAE 中创建自定义智能体，并为其配置提示词、MCP Server 与内置工具，使其能够协助你完成特定任务。同时，你也可以对已创建的自定义智能体进行管理，包括修改、分享和删除。

## 创建自定义智能体

你可以通过智能生成和手动创建两种方式来搭建自定义智能体。

1. 在 AI 对话输入框中输入 **@**，然后点击浮起面板底部的 **创建智能体** 按钮。  
   你将进入以下 **创建智能体** 面板。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/37c3f7714a1c4963ae6527b21a019209~tplv-goo7wpa0wc-topic.webp)
2. 选择一种方式来创建智能体，包括智能生成和手动创建。

### 智能生成（推荐）

若你选择智能生成智能体，使用以下步骤：

1. 在 **创建智能体** 面板的右上角，点击 **智能生成** 按钮。
2. 在 **智能生成智能体** 弹窗中，描述智能体的功能、使用场景、使用时机等。建议提供全面的描述，让生成的智能体能更加符合你的要求。  
   ![Image](https://p16-arcosite-sg.ibyteimg.com/tos-alisg-i-k9wyc2ijk0-sg/823fda0e405041d588f11e8c39509b1b~tplv-k9wyc2ijk0-image.image)
3. (可选) 勾选 **默认开启智能生成** 复选框。  
   每次进入 **创建智能体** 面板时，将自动展示 **智能生成智能体** 弹窗。
4. 点击 **生成** 按钮。  
   系统开始按你的描述生成一个智能体。
5. 按需修改自动生成的智能体的参数。

   | **参数** | **说明** |
   | --- | --- |
   | 头像 | (可选) 上传图片作为智能体的头像。 |
   | 名称 | 输入智能体的名称。 |
   | 提示词 | 输入智能体的提示词（Prompt），用于规范和指导智能体完成任务的方式。你可以规定智能体的人设、回答口吻、工作流程、使用工具的时机和需要遵守的规范等。 |
   | 可被其他智能体调用 | 开启后，该智能体可被其他智能体调用，以完成模块化任务。被调用时，该智能体拥有独立的上下文。必配参数如下：  * **英文标识名**：该智能体被调用时的唯一英文标识，例如 project-analyzer。 * **何时调用**：描述其他智能体调用该智能体的合适场景和时机。 目前，仅内置智能体 ”Agent“ 可调用自定义智能体，详情参考《[内置智能体：Agent](/ide_built-in-agent)》。 |
   | 工具 | 配置智能体处理需求时可以调用的工具，包括：  * **MCP Server**：添加 MCP Server 后，智能体在处理你的需求时可调用 MCP Server 提供的工具。你可以为一个智能体添加一个或多个 MCP Server。关于 MCP Server 的更多信息，参考《[模型上下文协议（MCP）](/ide/model-context-protocol)》。 * **内置工具**   + 阅读：对文件进行检索和查看。   + 文件系统：对文件进行增删改查。   + 终端：在终端运行命令，并获取命令的运行状态和结果。   + 联网搜索：搜索和用户任务相关的网页内容。   + 预览：在生成可预览的前端结果后提供预览入口。 |
6. 在面板底部，点击 **创建** 按钮。

### 手动创建

若你选择手动创建智能体，则需要依次配置以下参数，然后点击底部的 **创建** 按钮来完成创建。

| **参数** | **说明** |
| --- | --- |
| 头像 | (可选) 上传图片作为智能体的头像。 |
| 名称 | 输入智能体的名称。 |
| 提示词 | 输入智能体的提示词（Prompt），用于规范和指导智能体完成任务的方式。你可以规定智能体的人设、回答口吻、工作流程、使用工具的时机和需要遵守的规范等。 |
| 可被其他智能体调用 | 开启后，该智能体可被其他智能体调用，以完成模块化任务。被调用时，该智能体拥有独立的上下文。必配参数如下：   * **英文标识名**：该智能体被调用时的唯一英文标识，例如 project-analyzer。 * **何时调用**：描述其他智能体调用该智能体的合适场景和时机。   目前，仅内置智能体 ”Agent“ 可调用自定义智能体，详情参考《[内置智能体：Agent](/ide_built-in-agent)》。 |
| 工具 | 配置智能体处理需求时可以调用的工具，包括：   * **MCP Server**：添加 MCP Server 后，智能体在处理你的需求时可调用 MCP Server 提供的工具。你可以为一个智能体添加一个或多个 MCP Server。关于 MCP Server 的更多信息，参考《[模型上下文协议（MCP）](/ide/model-context-protocol)》。 * **内置工具**   + 阅读：对文件进行检索和查看。   + 文件系统：对文件进行增删改查。   + 终端：在终端运行命令，并获取命令的运行状态和结果。   + 联网搜索：搜索和用户任务相关的网页内容。   + 预览：在生成可预览的前端结果后提供预览入口。 |

## 使用智能体

在 AI 对话输入框中，输入 @ 或者点击 **@智能体**，然后在智能体列表中选择你想用的智能体。

![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/192b08890b6141878d7c7c2efeb609d5~tplv-goo7wpa0wc-topic.webp)

## 修改/分享/删除智能体

你可以按需管理自定义智能体，包括：

* 修改自定义智能体的配置。
* 直接通过 TRAE IDE 将自定义智能体分享至掘金社区，或通过复制自定义智能体的链接来将其分享至更多渠道。

  提示

  分享前，建议对智能体提示词和 MCP Server 配置中的信息进行脱敏。
* 删除自定义智能体。

在自定义智能体列表中，点击 **设置** 图标，然后在菜单中选择相应的选项并完成所需操作。

![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/4fd35df99a7f43428af892581901ccc4~tplv-goo7wpa0wc-topic.webp)

对于分享智能体，除通过智能体设置菜单操作外，你也可以先进入智能体的编辑面板，然后点击智能体名称右侧的 **分享** 按钮进行分享。

![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/86bd90377bbf4b2fb56e5ca765bbf442~tplv-goo7wpa0wc-topic.webp)

## 导入智能体

你可以将他人分享的智能体导入至 TRAE IDE，从而复用智能体的配置。

1. 点击他人分享的链接。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/79d293bb9d55479daf8bf2528d765be2~tplv-goo7wpa0wc-topic.webp)
2. 根据浏览器的引导打开 TRAE IDE。  
   TRAE IDE 中弹出智能体的信息展示窗口。
3. 点击 **立即获取** 按钮。  
   TRAE IDE 导入该智能体并将你导航至该智能体的配置页面。

## 可一键导入 TRAE 的自定义智能体

针对项目开发中的不同场景，TRAE 官方提供了一系列可直接导入并使用的自定义智能体示例。这些智能体可以被单独调用；或在开发流程的相应阶段由内置智能体 “Agent” 自动调用，以完成特定任务。详情参考[支持一键导入的自定义智能体](/ide/custom-agents-ready-for-one-click-import)。

文档对您有帮助吗?

有帮助无帮助

[上一篇

内置智能体：Agent](/ide_built-in-agent)[下一篇

子智能体（Subagent）](/ide_subagents)

[创建自定义智能体](#ccac21ad "创建自定义智能体")

[智能生成（推荐）](#16ef7839 "智能生成（推荐）")

[手动创建](#616b694d "手动创建")

[使用智能体](#cbdba256 "使用智能体")

[修改/分享/删除智能体](#383b1d83 "修改/分享/删除智能体")

[导入智能体](#04f01828 "导入智能体")

[可一键导入 TRAE 的自定义智能体](#dc4b49a5 "可一键导入 TRAE 的自定义智能体")

window.collectEvent("init",{app\_id:945902,disable\_auto\_pv:!0,channel:"cn"}),window.collectEvent("config",{platform\_env:"renderer",platform\_host:"undefined"!=typeof location?location.host:""}),window.collectEvent("start")["6493","7756","7807","3234","9150","3313"]{"namedChunks":["$","rag-widget"]}window.\_SSR\_DATA = {"data":{},"context":{"request":{"params":{},"query":{},"pathname":"\u002Fide\_agent","host":"docs.trae.cn","url":"https:\u002F\u002Fdocs.trae.cn\u002Fide\_agent"},"reporter":{}},"mode":"string","renderLevel":2}
window.\_ROUTER\_DATA = {"loaderData":{"layout":{"prefectLang":"zh","url":"http:\u002F\u002Fdocs.trae.cn\u002Fide\_agent","env":"prod"},"$":{"code":0,"data":{"basePath":"\u002F","doc":{"tab\_id":"67a5b43a9ae5aa03545c7a07","path":"ide\_agent","\_id":"6a4e00bf8a804d01b3e42035","title":"创建并管理自定义智能体","content":"你可以在 TRAE 中创建自定义智能体，并为其配置提示词、MCP Server 与内置工具，使其能够协助你完成特定任务。同时，你也可以对已创建的自定义智能体进行管理，包括修改、分享和删除。\n\n## 创建自定义智能体 {#ccac21ad}\n\n你可以通过智能生成和手动创建两种方式来搭建自定义智能体。\n\n1. 在 AI 对话输入框中输入 \*\*@\*\*，然后点击浮起面板底部的 \*\*创建智能体\*\* 按钮。\n 你将进入以下 \*\*创建智能体\*\* 面板。\n ![Image=550x587](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F37c3f7714a1c4963ae6527b21a019209~tplv-goo7wpa0wc-topic.png)\n2. 选择一种方式来创建智能体，包括智能生成和手动创建。\n\n### 智能生成（推荐） {#16ef7839}\n\n若你选择智能生成智能体，使用以下步骤：\n\n1. 在 \*\*创建智能体\*\* 面板的右上角，点击 \*\*智能生成\*\* 按钮。\n2. 在 \*\*智能生成智能体\*\* 弹窗中，描述智能体的功能、使用场景、使用时机等。建议提供全面的描述，让生成的智能体能更加符合你的要求。\n ![Image=500x240](https:\u002F\u002Fp16-arcosite-sg.ibyteimg.com\u002Ftos-alisg-i-k9wyc2ijk0-sg\u002F823fda0e405041d588f11e8c39509b1b~tplv-k9wyc2ijk0-image.image)\n3. (可选) 勾选 \*\*默认开启智能生成\*\* 复选框。\n 每次进入 \*\*创建智能体\*\* 面板时，将自动展示 \*\*智能生成智能体\*\* 弹窗。\n4. 点击 \*\*生成\*\* 按钮。\n 系统开始按你的描述生成一个智能体。\n5. 按需修改自动生成的智能体的参数。\n \u003C!-- @cols-width: 164,729 --\u003E\n | | | \\\n |\*\*参数\*\* |\*\*说明\*\* |\n |---|---|\n |头像 |(可选) 上传图片作为智能体的头像。 |\n |名称 |输入智能体的名称。 |\n |提示词 |输入智能体的提示词（Prompt），用于规范和指导智能体完成任务的方式。你可以规定智能体的人设、回答口吻、工作流程、使用工具的时机和需要遵守的规范等。 |\n |可被其他智能体调用 |开启后，该智能体可被其他智能体调用，以完成模块化任务。被调用时，该智能体拥有独立的上下文。必配参数如下： |\\\n | | |\\\n | |\* \*\*英文标识名\*\*：该智能体被调用时的唯一英文标识，例如 project-analyzer。 |\\\n | |\* \*\*何时调用\*\*：描述其他智能体调用该智能体的合适场景和时机。 |\\\n | | |\\\n | |目前，仅内置智能体 ”Agent“ 可调用自定义智能体，详情参考《[内置智能体：Agent](\u002Fide\_built-in-agent)》。 |\n |工具 |配置智能体处理需求时可以调用的工具，包括： |\\\n | | |\\\n | |\* \*\*MCP Server\*\*：添加 MCP Server 后，智能体在处理你的需求时可调用 MCP Server 提供的工具。你可以为一个智能体添加一个或多个 MCP Server。关于 MCP Server 的更多信息，参考《[模型上下文协议（MCP）](\u002Fide\u002Fmodel-context-protocol)》。 |\\\n | |\* \*\*内置工具\*\* |\\\n | | \* 阅读：对文件进行检索和查看。 |\\\n | | \* 文件系统：对文件进行增删改查。 |\\\n | | \* 终端：在终端运行命令，并获取命令的运行状态和结果。 |\\\n | | \* 联网搜索：搜索和用户任务相关的网页内容。 |\\\n | | \* 预览：在生成可预览的前端结果后提供预览入口。 |\n6. 在面板底部，点击 \*\*创建\*\* 按钮。\n\n### 手动创建 {#616b694d}\n\n若你选择手动创建智能体，则需要依次配置以下参数，然后点击底部的 \*\*创建\*\* 按钮来完成创建。\n\n\u003C!-- @cols-width: 164,749 --\u003E\n| | | \\\n|\*\*参数\*\* |\*\*说明\*\* |\n|---|---|\n|头像 |(可选) 上传图片作为智能体的头像。 |\n|名称 |输入智能体的名称。 |\n|提示词 |输入智能体的提示词（Prompt），用于规范和指导智能体完成任务的方式。你可以规定智能体的人设、回答口吻、工作流程、使用工具的时机和需要遵守的规范等。 |\n|可被其他智能体调用 |开启后，该智能体可被其他智能体调用，以完成模块化任务。被调用时，该智能体拥有独立的上下文。必配参数如下： |\\\n| | |\\\n| |\* \*\*英文标识名\*\*：该智能体被调用时的唯一英文标识，例如 project-analyzer。 |\\\n| |\* \*\*何时调用\*\*：描述其他智能体调用该智能体的合适场景和时机。 |\\\n| | |\\\n| |目前，仅内置智能体 ”Agent“ 可调用自定义智能体，详情参考《[内置智能体：Agent](\u002Fide\_built-in-agent)》。 |\n|工具 |配置智能体处理需求时可以调用的工具，包括： |\\\n| | |\\\n| |\* \*\*MCP Server\*\*：添加 MCP Server 后，智能体在处理你的需求时可调用 MCP Server 提供的工具。你可以为一个智能体添加一个或多个 MCP Server。关于 MCP Server 的更多信息，参考《[模型上下文协议（MCP）](\u002Fide\u002Fmodel-context-protocol)》。 |\\\n| |\* \*\*内置工具\*\* |\\\n| | \* 阅读：对文件进行检索和查看。 |\\\n| | \* 文件系统：对文件进行增删改查。 |\\\n| | \* 终端：在终端运行命令，并获取命令的运行状态和结果。 |\\\n| | \* 联网搜索：搜索和用户任务相关的网页内容。 |\\\n| | \* 预览：在生成可预览的前端结果后提供预览入口。 |\n\n## 使用智能体 {#cbdba256}\n\n在 AI 对话输入框中，输入 @ 或者点击 \*\*@智能体\*\*，然后在智能体列表中选择你想用的智能体。\n\n![Image=500x276](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F192b08890b6141878d7c7c2efeb609d5~tplv-goo7wpa0wc-image.image)\n\n## 修改\u002F分享\u002F删除智能体 {#383b1d83}\n\n你可以按需管理自定义智能体，包括：\n\n\* 修改自定义智能体的配置。\n\* 直接通过 TRAE IDE 将自定义智能体分享至掘金社区，或通过复制自定义智能体的链接来将其分享至更多渠道。\n :::tip 提示\n 分享前，建议对智能体提示词和 MCP Server 配置中的信息进行脱敏。\n :::\n\* 删除自定义智能体。\n\n在自定义智能体列表中，点击 \*\*设置\*\* 图标，然后在菜单中选择相应的选项并完成所需操作。\n\n![Image=500x331](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F4fd35df99a7f43428af892581901ccc4~tplv-goo7wpa0wc-image.image)\n\n对于分享智能体，除通过智能体设置菜单操作外，你也可以先进入智能体的编辑面板，然后点击智能体名称右侧的 \*\*分享\*\* 按钮进行分享。\n\n![Image=500x131](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F86bd90377bbf4b2fb56e5ca765bbf442~tplv-goo7wpa0wc-image.image)\n\n## 导入智能体 {#04f01828}\n\n你可以将他人分享的智能体导入至 TRAE IDE，从而复用智能体的配置。\n\n1. 点击他人分享的链接。\n ![Image=450x223](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F79d293bb9d55479daf8bf2528d765be2~tplv-goo7wpa0wc-image.image)\n2. 根据浏览器的引导打开 TRAE IDE。\n TRAE IDE 中弹出智能体的信息展示窗口。\n3. 点击 \*\*立即获取\*\* 按钮。\n TRAE IDE 导入该智能体并将你导航至该智能体的配置页面。 \n\n\n## 可一键导入 TRAE 的自定义智能体 {#dc4b49a5}\n\n针对项目开发中的不同场景，TRAE 官方提供了一系列可直接导入并使用的自定义智能体示例。这些智能体可以被单独调用；或在开发流程的相应阶段由内置智能体 “Agent” 自动调用，以完成特定任务。详情参考[支持一键导入的自定义智能体](\u002Fide\u002Fcustom-agents-ready-for-one-click-import)。\n","type":"doc","meta":{"description":"该文档介绍了在TRAE中创建并管理自定义智能体的方法。可通过智能生成或手动创建搭建，配置提示词、MCP Server与内置工具等参数。创建后能在AI对话中使用，还可对其进行修改、分享和删除等管理操作，帮助用户利用自定义智能体完成特定任务。","keywords":["TRAE","自定义智能体","创建","管理","提示词"]},"created\_at":"2026-07-08T07:48:15.628Z","updated\_at":"2026-07-08T07:48:15.628Z"},"tabs":[{"\_id":"67a5b43a9ae5aa03545c7a07","name":"TRAE IDE","doc\_path":"ide\_trae-overview","sort":1738912826317000},{"\_id":"69ae930b9e3a5d0550e655c6","name":"TRAE Work","doc\_path":"work\_what-is-trae-solo","sort":1742260835606000},{"\_id":"67f399815eb9ea04ed5a0dc2","name":"TRAE 插件","doc\_path":"plugin\_what-is-trae-plugin","sort":1744017793008000},{"\_id":"69393503cb3f7404dd1ba797","name":"TRAE CLI","doc\_path":"cli\_what-is-trae-cli","sort":1765356803650000},{"\_id":"6a56350b17d05701c37b7df4","name":"企业版","doc\_path":null,"type":"group","sort":1777277513227100},{"\_id":"69ef1a491b2d8604fb497803","name":"用户指南","doc\_path":"enterprise\_trae-enterprise-edition-overview","parent\_id":"6a56350b17d05701c37b7df4","sort":1784034631531900},{"\_id":"6a56354717d05701c37b7e45","name":"API 参考","doc\_path":"enterprise\_trae-cn-enterprise-api","parent\_id":"6a56350b17d05701c37b7df4","type":"common","sort":1784034631532000}],"menus":[{"\_id":"6a4dc0de4bdbc784e33c6fec","doc\_release\_id":"6a587c483d87c401e4c3f5e4","hidden":false,"parent\_id":null,"path":"ide\_trae-overview","sort":1780912445574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE 概览"},{"\_id":"6a27b7bf4bdbc784e337fba3","doc\_release\_id":"6a69bb5c31547d01b9f85ac7","hidden":false,"parent\_id":null,"path":"ide\_trae-solo-is-now-available","sort":1780949588013500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重磅更新：TRAE Work 客户端上线"},{"\_id":"6a27b7bf4bdbc784e337fbaf","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730457000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"入门"},{"\_id":"6a27b7bf4bdbc784e337fbc2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730462000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"教程 & 最佳实践"},{"\_id":"6a66d8394bdbc784e314a365","hidden":false,"parent\_id":null,"path":null,"sort":1780986730469000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"最新动态","doc\_release\_id":null},{"\_id":"6a27b7bf4bdbc784e337fbc6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730476000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程核心"},{"\_id":"6a27b7bf4bdbc784e337fbf2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730477000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式"},{"\_id":"6a27b7bf4bdbc784e337fbf6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730479000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具与插件"},{"\_id":"6a27b7bf4bdbc784e337fc12","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730486000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作环境"},{"\_id":"6a27b7bf4bdbc784e337fc22","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730491000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置"},{"\_id":"6a27b7bf4bdbc784e337fc26","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730492000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益"},{"\_id":"6a27b7bf4bdbc784e337fc54","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730503000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"问题排查"},{"\_id":"6a27b7bf4bdbc784e337fc5b","doc\_release\_id":"6a394f1addf14401b2a89a64","hidden":false,"parent\_id":null,"path":"ide\_contact-us","sort":1780986730507000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"联系我们"},{"\_id":"6a27b7bf4bdbc784e337fc61","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730508000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"相关协议"},{"\_id":"6a27b7bf4bdbc784e337fbb3","doc\_release\_id":"6a57252ad0270601e250743f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_what-is-trae","sort":1780986730455000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"什么是 TRAE IDE？"},{"\_id":"6a27b7bf4bdbc784e337fbb7","doc\_release\_id":"6a60bfded0dfed01aa9be4ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_get-started-with-trae","sort":1780986730458000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快速开始"},{"\_id":"6a27b7bf4bdbc784e337fbba","doc\_release\_id":"6a2a99737d55f901e2b4b294","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_device-limit","sort":1780986730459000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"设备数量限制"},{"\_id":"6a27b7bf4bdbc784e337fbbe","doc\_release\_id":"6a63745a6c585801d078a7c2","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_changelog","sort":1780986730461000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"更新日志"},{"\_id":"6a27b7bf4bdbc784e337fba5","doc\_release\_id":"6a435d8142bb2101b15d8c07","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_trae-editor-for-unity-tutorial","sort":1780986730509900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE Editor for Unity：让 AI 融入 Unity 开发工作流"},{"\_id":"6a27b7bf4bdbc784e337fc68","doc\_release\_id":"6a2a99737d55f901e2b4b2ae","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_top-10-recommended-skills-for-development-scenarios","sort":1780986730510000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"研发场景十大热门 Skill 推荐"},{"\_id":"6a27b7bf4bdbc784e337fc70","doc\_release\_id":"6a2a99737d55f901e2b4b2b0","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_best-practice-for-how-to-write-a-good-skill","sort":1780986730512000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"如何写好一个 Skill：从创建到迭代的最佳实践"},{"\_id":"6a27b7bf4bdbc784e337fc73","doc\_release\_id":"6a2a99737d55f901e2b4b2b1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_most-used-mcp-servers-in-trae","sort":1780986730513000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"热门 MCP Server 详解"},{"\_id":"6a27b7bf4bdbc784e337fc7d","doc\_release\_id":"6a2a99737d55f901e2b4b2b3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_custom-agents-ready-for-one-click-import","sort":1780986730516000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"支持一键导入的自定义智能体"},{"\_id":"6a27b7bf4bdbc784e337fc80","doc\_release\_id":"6a2a99737d55f901e2b4b2b4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_ai-coding-case-streams-to-river","sort":1780986730517000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程实践：“积流成江” 的开发故事"},{"\_id":"6a27b7bf4bdbc784e337fc84","doc\_release\_id":"6a2a99737d55f901e2b4b2b5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-figma","sort":1780986730518000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：将 Figma 设计稿转化为前端代码"},{"\_id":"6a27b7bf4bdbc784e337fca2","doc\_release\_id":"6a2a99737d55f901e2b4b2bb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-playwright","sort":1780986730526000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：实现网页自动化测试"},{"\_id":"6a27b7bf4bdbc784e337fca5","doc\_release\_id":"6a2a99737d55f901e2b4b2bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-amap","sort":1780986730527000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：使用高德地图 MCP Server 规划行程"},{"\_id":"6a27b7bf4bdbc784e337fbc9","doc\_release\_id":"6a30083104efdb01aa0e3acb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_chat","sort":1780986730463000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"对话"},{"\_id":"6a27b7bf4bdbc784e337fbcd","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730464000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型"},{"\_id":"6a27b7bf4bdbc784e337fbd3","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730466000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文"},{"\_id":"6a27b7bf4bdbc784e337fbd6","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730467000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体（Agent）"},{"\_id":"6a27b7bf4bdbc784e337fbd9","doc\_release\_id":"6a43adb274518b01bb2b602d","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_skills","sort":1780986730468000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"技能（Skill）"},{"\_id":"6a27b7bf4bdbc784e337fbdf","doc\_release\_id":"6a2a99737d55f901e2b4b298","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_rules","sort":1780986730470000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"规则（Rule）"},{"\_id":"6a27b7bf4bdbc784e337fbe2","doc\_release\_id":"6a43843cb81ed601bad58c35","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_memories","sort":1780986730471000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"记忆"},{"\_id":"6a27b7bf4bdbc784e337fbe7","doc\_release\_id":"6a435d9695138601b04b1aa9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_slash-commands","sort":1780986730472000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"命令"},{"\_id":"6a2bed994bdbc784e3b39779","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"钩子（Hook）"},{"\_id":"6a27b7bf4bdbc784e337fbec","doc\_release\_id":"6a2a99737d55f901e2b4b29b","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_cue","sort":1780986730473250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"超级代码补全：CUE"},{"\_id":"6a6701dd4bdbc784e31fe0f1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473375,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批","doc\_release\_id":null},{"\_id":"6a435cb64bdbc784e33d8105","doc\_release\_id":"6a6067cee1be3e01a9085e57","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_spec-and-plan-workflows","sort":1780986730473500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置工作流：Plan、Spec 与 Goal"},{"\_id":"6a5e13b84bdbc784e379d139","doc\_release\_id":"6a5e173544d11701b082c1f7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_browser-use","sort":1780986730474250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"浏览器控制"},{"\_id":"6a27b7bf4bdbc784e337fbee","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730475000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"代码质量"},{"\_id":"6a27b7bf4bdbc784e337fc04","doc\_release\_id":"6a5995bc6d002301b9c31436","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_models","sort":1780986730482000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置模型 & 自定义模型"},{"\_id":"6a27b7bf4bdbc784e337fd07","doc\_release\_id":"6a599631cb530701b9ea62d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_auto-mode","sort":1780986730555000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Auto 模式"},{"\_id":"6a27b7bf4bdbc784e337fc88","doc\_release\_id":"6a2a99737d55f901e2b4b2b6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_basic-usage-of-context","sort":1780986730520000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"基础用法"},{"\_id":"6a27b7bf4bdbc784e337fc96","doc\_release\_id":"6a2a99737d55f901e2b4b2b8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_number-sign","sort":1780986730523000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 # 符号引用上下文"},{"\_id":"6a27b7bf4bdbc784e337fc99","doc\_release\_id":"6a2a99737d55f901e2b4b2b9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_codebase-indexing","sort":1780986730524000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作区代码索引"},{"\_id":"6a27b7bf4bdbc784e337fc9f","doc\_release\_id":"6a2a99737d55f901e2b4b2ba","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_ignore-files","sort":1780986730525000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"忽略文件"},{"\_id":"6a27b7bf4bdbc784e337fd24","doc\_release\_id":"6a2a9d567d55f901e2b4b7ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_context-compaction","sort":1780986730562000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文压缩"},{"\_id":"6a27b7bf4bdbc784e337fcfb","doc\_release\_id":"6a435dc03e465301b37694fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent-overview","sort":1780986730551000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体概述"},{"\_id":"6a27b7bf4bdbc784e337fd11","doc\_release\_id":"6a69e3f71eefd201b2ba0e7f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_built-in-agent","sort":1780986730552000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置智能体：Agent"},{"\_id":"6a27b7bf4bdbc784e337fd00","doc\_release\_id":"6a4e00bf8a804d01b3e42035","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent","sort":1780986730553000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"创建并管理自定义智能体"},{"\_id":"6a3be0874bdbc784e3da357d","doc\_release\_id":"6a435cac3e465301b3769451","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_subagents","sort":1780986730553500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"子智能体（Subagent）"},{"\_id":"6a27b7bf4bdbc784e337fd04","doc\_release\_id":"6a3a2f8818b37b01bc6660ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_auto-run-and-security","sort":1780986730554000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自动运行 & 安全性"},{"\_id":"6a27b7bf4bdbc784e337fd97","doc\_release\_id":"6a2a99737d55f901e2b4b2f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_agent-powered-code-review","sort":1780986730594000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能代码审查"},{"\_id":"6a27b7bf4bdbc784e337fd9a","doc\_release\_id":"6a2a99737d55f901e2b4b2f5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_refactoring-insights","sort":1780986730596000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重构洞察"},{"\_id":"6a27b7bf4bdbc784e337fd0d","doc\_release\_id":"6a435ccf3e465301b3769497","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_solo-mode","sort":1780986730557000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式概览"},{"\_id":"6a27b7bf4bdbc784e337fd18","doc\_release\_id":"6a2a99737d55f901e2b4b2d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_task-management","sort":1780986730559000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"多任务并行"},{"\_id":"6a27b7bf4bdbc784e337fd1b","doc\_release\_id":"6a435cdb42bb2101b15d8bca","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_tool-panel","sort":1780986730560000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具面板"},{"\_id":"6a27b7bf4bdbc784e337fd21","doc\_release\_id":"6a2a99737d55f901e2b4b2d7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_figma-to-code","sort":1780986730561000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Figma 设计还原"},{"\_id":"6a27b7bf4bdbc784e337fc8c","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":null,"sort":1780986730521000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型上下文协议（MCP）"},{"\_id":"6a27b7bf4bdbc784e337fc90","doc\_release\_id":"6a2a99737d55f901e2b4b2b7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":"ide\_manage-extensions","sort":1780986730522000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"插件"},{"\_id":"6a27b7bf4bdbc784e337fc16","doc\_release\_id":"6a2beedc73064f01baed0009","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_wsl","sort":1780986730487000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 WSL 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1b","doc\_release\_id":"6a2beefce1e9a201bbc6b5fc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_ssh-remote","sort":1780986730488000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 SSH 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1e","doc\_release\_id":"6a69cae41eefd201b2b9fd3e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_sandbox","sort":1780986730490000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"(Legacy) 沙箱"},{"\_id":"6a27b7bf4bdbc784e337fc2a","doc\_release\_id":"6a2a99737d55f901e2b4b2a3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_ide-settings","sort":1780986730493000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置总览"},{"\_id":"6a27b7bf4bdbc784e337fc2d","doc\_release\_id":"6a2a99737d55f901e2b4b2a4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_keyboard-shortcuts","sort":1780986730494000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快捷键"},{"\_id":"6a27b7bf4bdbc784e337fc32","doc\_release\_id":"6a2a99737d55f901e2b4b2a5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_source-control","sort":1780986730496000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"源代码管理"},{"\_id":"6a27b7bf4bdbc784e337fc36","doc\_release\_id":"6a2a99737d55f901e2b4b2a6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_mark-for-ai-use","sort":1780986730497000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"终端：标记为 AI 使用"},{"\_id":"6a27b7bf4bdbc784e337fc3c","doc\_release\_id":"6a2a99737d55f901e2b4b2a7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_resource-explorer","sort":1780986730498000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"进程资源管理器"},{"\_id":"6a27b7bf4bdbc784e337fc40","doc\_release\_id":"6a2a99737d55f901e2b4b2a8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_privacy-mode","sort":1780986730499000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"隐私模式"},{"\_id":"6a27b7bf4bdbc784e337fda7","doc\_release\_id":"6a3fc9e7c078e201ba51b2aa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_fast-pass-overview","sort":1780986730600000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益概览"},{"\_id":"6a27b7bf4bdbc784e337fdac","doc\_release\_id":"6a4747342877b801c43145bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_susbcription-management","sort":1780986730601000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"管理 “速通” 权益订阅"},{"\_id":"6a27b7bf4bdbc784e337fdb0","doc\_release\_id":"6a2aa42a76fca701e31edf80","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_use-fast-pass","sort":1780986730603000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 “速通“ 权益"},{"\_id":"6a27b7bf4bdbc784e337fdb3","doc\_release\_id":"6a2a99737d55f901e2b4b2fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_confirmation-letter-for-vat-general-invoices","sort":1780986730604000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"增值税普通发票确认书"},{"\_id":"6a27b7bf4bdbc784e337fd28","doc\_release\_id":"6a4334713e465301b376912e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_get-logs-or-session-id","sort":1780986730563000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"获取日志或 SessionID"},{"\_id":"6a27b7bf4bdbc784e337fd2c","doc\_release\_id":"6a2a99737d55f901e2b4b2da","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-general-issues","sort":1780986730564000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"常规问题"},{"\_id":"6a27b7bf4bdbc784e337fd30","doc\_release\_id":"6a2a99737d55f901e2b4b2db","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_error-codes","sort":1780986730565000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"错误码"},{"\_id":"6a27b7bf4bdbc784e337fd33","doc\_release\_id":"6a2a99737d55f901e2b4b2dc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_prigramming-languages-related","sort":1780986730566000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"编程语言相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd37","doc\_release\_id":"6a2a99737d55f901e2b4b2dd","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-mcp-server-related-issues","sort":1780986730567000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd51","doc\_release\_id":"6a2a99737d55f901e2b4b2e4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-remote-ssh-related-issues","sort":1780986730574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Remote SSH 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd7b","doc\_release\_id":"6a2a99737d55f901e2b4b2ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-performance-issues","sort":1780986730586000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"性能问题"},{"\_id":"6a27b7bf4bdbc784e337fcf4","doc\_release\_id":"6a340e5b620bf701bbe02508","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_open-source-software-notice","sort":1780986730549000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"开源软件声明"},{"\_id":"6a27b7bf4bdbc784e337fcf7","doc\_release\_id":"6a2a99737d55f901e2b4b2ce","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_intro-to-llm","sort":1780986730550000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"豆包大模型备案公示"},{"\_id":"6a27b7bf4bdbc784e337fd57","doc\_release\_id":"6a2a99737d55f901e2b4b2e5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_model-context-protocol","sort":1780986730575000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 概览"},{"\_id":"6a27b7bf4bdbc784e337fd5a","doc\_release\_id":"6a2a99737d55f901e2b4b2e6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_add-mcp-servers","sort":1780986730576000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"添加 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd5e","doc\_release\_id":"6a2aa13b7d55f901e2b4b8f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_mcp-server-install-links","sort":1780986730578000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 安装链接"},{"\_id":"6a27b7bf4bdbc784e337fd63","doc\_release\_id":"6a2a99737d55f901e2b4b2e8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_use-mcp-servers-in-agents","sort":1780986730579000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"在智能体中使用 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd66","doc\_release\_id":"6a2a99737d55f901e2b4b2e9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_check-mcp-server-logs","sort":1780986730580000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"查看 MCP Server 的日志"},{"\_id":"6a2bed994bdbc784e3b39784","doc\_release\_id":"6a2bed9904efdb01aa0bf262","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_automate-actions-with-hooks","sort":1780986730598000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 Hook 实现自动化"},{"\_id":"6a2bed9d4bdbc784e3b39872","doc\_release\_id":"6a3e2cb5d6149c01ba317774","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_hook-configuration-reference","sort":1781165376289000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Hook 配置详解"},{"\_id":"6a66d8494bdbc784e314a6b6","doc\_release\_id":"6a6709d9baafae01bdda06f2","hidden":false,"parent\_id":"6a66d8394bdbc784e314a365","path":"ide\_coming-soon","sort":1785124921280900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"即将上线：以积分为基础的计费模式"},{"\_id":"6a69ca9b4bdbc784e3dde75b","doc\_release\_id":"6a69df1db0d56301bade22ae","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_permission-and-approval","sort":1785135581001000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批概览"},{"\_id":"6a69caa44bdbc784e3ddea56","doc\_release\_id":"6a69cdfab0d56301bade185a","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-permission-mode-configuration-reference","sort":1785135581001100,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义权限模式配置参考"},{"\_id":"6a69cab04bdbc784e3ddeee2","doc\_release\_id":"6a69cab01eefd201b2b9fcb7","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-global-permission-configuration-reference","sort":1785157495167000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义全局权限配置参考"}],"site":{"\_id":"6a27b21694049701b9d125e0","name":"TRAE","icon":"https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Ff5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png","logo\_link":"https:\u002F\u002Fwww.trae.cn\u002F","custom\_domain":{"domains":["docs.trae.cn"],"domain\_path":"\u002F"},"seo":{"googleMetaKey":"Djn\_d63iCka07pN3cVhp3GJBTa8yKbmOkvLf45CuD6k","bingMetaKey":"","baiduMetaKey":"codeva-6r8UBfgVA4"},"rag":{"enable":true,"knowledge":{"scope":"all"},"rules":{"model":4,"prompt":"# 角色\n你是 TRAE 文档问答助手，仅基于检索到的官方文档片段回答用户问题。\n\n# 核心准则\n1. 严格依据文档作答。文档未涵盖的内容直接说\"未在文档中找到相关说明\"，不要补充、不要推测。\n2. 文档片段相互矛盾时，优先采用更新时间较近的版本，并提示用户\"文档中存在不同表述，建议核对最新版本\"。\n\n# 边界\n- 用户追问与文档无关的内容时，礼貌引导回到文档主题。\n- 不臆测产品路线图、未发布功能、价格政策细节。\n- 不与用户争辩；用户质疑回答时，重新检索并诚实说明依据。","count":10,"questions":["TRAE IDE 里最热门的 Skill 是哪些？","如何创建自定义智能体？","如何配置 Rules？"],"welcome":{"title":"TRAE 智能问答助手","content":"你好，我是 TRAE 文档问答助手 🎉\n你在阅读当前文档的过程中，无论对文档概念的解释，还是文档内容方面的疑问，都可以随时向我提问，我会全力为你解答"},"fallback":"抱歉，未在文档中找到相关说明"}},"feedback":{"enable":true}}}}},"errors":null}
