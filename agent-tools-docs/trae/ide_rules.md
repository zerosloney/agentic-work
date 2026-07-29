# trae / ide_rules

> Source: https://docs.trae.cn/ide_rules
> Fetched: 2026-07-29 20:24:38

---

规则（Rule）(()=>{"use strict";var e,t,r,a,n,o,c,f,i={},d={};function l(e){var t=d[e];if(void 0!==t)return t.exports;var r=d[e]={exports:{}};return i[e].call(r.exports,r,r.exports,l),r.exports}if(l.m=i,l.n=e=>{var t=e&&e.\_\_esModule?()=>e.default:()=>e;return l.d(t,{a:t}),t},t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.\_\_proto\_\_,l.t=function(r,a){if(1&a&&(r=this(r)),8&a||"object"==typeof r&&r&&(4&a&&r.\_\_esModule||16&a&&"function"==typeof r.then))return r;var n=Object.create(null);l.r(n);var o={};e=e||[null,t({}),t([]),t(t)];for(var c=2&a&&r;("object"==typeof c||"function"==typeof c)&&!~e.indexOf(c);c=t(c))Object.getOwnPropertyNames(c).forEach(e=>{o[e]=()=>r[e]});return o.default=()=>r,l.d(n,o),n},l.d=(e,t)=>{for(var r in t)l.o(t,r)&&!l.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},l.f={},l.e=e=>Promise.all(Object.keys(l.f).reduce((t,r)=>(l.f[r](e,t),t),[])),l.u=e=>"static/js/async/"+({3234:"$",3313:"rag-widget",7807:"page"}[e]||e)+"."+{1032:"073ab03092",1093:"bea355c233",1162:"a2a9bd66ae",1207:"3f46ff7cea",1593:"f31179547b",1684:"2206314498",1689:"58fa40011d",183:"262384895c",1904:"5352aaf52d",1951:"f96298c6ae",1982:"412f609917",2180:"0fc77cf40c",2217:"f1be737b30",2703:"81b4be462c",2881:"14da83890c",3051:"5b8c9d25df",3157:"0bfac25da0",3234:"585a3f9198",3313:"023f1758d4",3500:"4663638c8d",3546:"37c5bced1e",3655:"562dcf22c3",3762:"89704f37a4",3985:"18974aa871",4020:"6ce4fa5b90",4097:"e90f0f2e7e",4171:"c9c86f7365",4310:"85b9099685",4316:"8d538c6be5",4526:"4767866220",460:"2973c28996",4604:"38511a7a33",4852:"e0234af886",4939:"80da571abe",503:"65cfe70275",5048:"60c3f9ea43",5396:"0be21ebdbc",5448:"06a6aeb469",5976:"c185faf589",609:"f1c471c143",6244:"adfc21bbf4",6562:"66393eebe9",6812:"ec46ff09a1",6851:"23d437c033",7367:"419a6b4240",7415:"2ee686629d",7558:"cfb7484405",7661:"4fb258de13",7756:"25c2bba752",7807:"d38bc8c689",7985:"79d04a715f",8547:"b37216d61f",8567:"197996a954",8579:"6a2c97a2db",8658:"58c1b0b296",8662:"b6d9df9408",8796:"f14c9a434a",8850:"dec5910a00",8880:"f5169d0ffa",9024:"c8f7837d89",9150:"a11152606a",9285:"d3e815b975",958:"f2fe0d9984",9735:"583d7ab809",9790:"69b86c9e8a",9865:"b6fdd8a42a",9879:"5b0db3af4f",9922:"7b2c65e80a"}[e]+".js",l.miniCssF=e=>"static/css/async/"+({3313:"rag-widget",7807:"page"}[e]||e)+"."+{3313:"6b79098a88",7756:"ddb1faeff0",7807:"7da9e47967"}[e]+".css",l.g=(()=>{if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}})(),l.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r={},a="@topic/renderer:",l.l=function(e,t,n,o){if(r[e])r[e].push(t);else{if(void 0!==n)for(var c,f,i=document.getElementsByTagName("script"),d=0;d<i.length;d++){var u=i[d];if(u.getAttribute("src")==e||u.getAttribute("data-rspack")==a+n){c=u;break}}c||(f=!0,(c=document.createElement("script")).timeout=120,l.nc&&c.setAttribute("nonce",l.nc),c.setAttribute("data-rspack",a+n),c.src=e),r[e]=[t];var s=function(t,a){c.onerror=c.onload=null,clearTimeout(b);var n=r[e];if(delete r[e],c.parentNode&&c.parentNode.removeChild(c),n&&n.forEach(function(e){return e(a)}),t)return t(a)},b=setTimeout(s.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=s.bind(null,c.onerror),c.onload=s.bind(null,c.onload),f&&document.head.appendChild(c)}},l.r=e=>{"u">typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"\_\_esModule",{value:!0})},l.nmd=e=>(e.paths=[],e.children||(e.children=[]),e),n=[],l.O=(e,t,r,a)=>{if(!t){var o=1/0;for(d=0;d<n.length;d++){for(var[t,r,a]=n[d],c=!0,f=0;f<t.length;f++)(!1&a||o>=a)&&Object.keys(l.O).every(e=>l.O[e](t[f]))?t.splice(f--,1):(c=!1,a<o&&(o=a));if(c){n.splice(d--,1);var i=r();void 0!==i&&(e=i)}}return e}a=a||0;for(var d=n.length;d>0&&n[d-1][2]>a;d--)n[d]=n[d-1];n[d]=[t,r,a]},l.p="//lf-arcosite.bytecdn.com/obj/arcosites/topic-cdn-1/","u">typeof document){var u={6408:0};l.f.miniCss=function(e,t){u[e]?t.push(u[e]):0!==u[e]&&{3313:1,7756:1,7807:1}[e]&&t.push(u[e]=new Promise(function(t,r){var a=l.miniCssF(e),n=l.p+a;if(function(e,t){for(var r=document.getElementsByTagName("link"),a=0;a<r.length;a++)if((c=(o=r[a]).getAttribute("data-href")||o.getAttribute("href"))&&(c=c.split("?")[0]),"stylesheet"===o.rel&&(c===e||c===t))return o;var n=document.getElementsByTagName("style");for(a=0;a<n.length;a++){var o,c;if((c=(o=n[a]).getAttribute("data-href"))===e||c===t)return o}}(a,n))return t();!function(e,t,r,a,n){var o=document.createElement("link");o.rel="stylesheet",o.type="text/css",l.nc&&(o.nonce=l.nc),o.href=t,o.onerror=o.onload=function(r){if(o.onerror=o.onload=null,"load"===r.type)a();else{var c=r&&("load"===r.type?"missing":r.type),f=r&&r.target&&r.target.href||t,i=Error("Loading CSS chunk "+e+" failed.\\n("+f+")");i.code="CSS\_CHUNK\_LOAD\_FAILED",i.type=c,i.request=f,o.parentNode&&o.parentNode.removeChild(o),n(i)}},r?r.parentNode.insertBefore(o,r.nextSibling):document.head.appendChild(o)}(e,n,null,t,r)}).then(function(){u[e]=0},function(t){throw delete u[e],t}))}}o={6408:0},l.f.j=function(e,t){var r=l.o(o,e)?o[e]:void 0;if(0!==r)if(r)t.push(r[2]);else if(6408!=e){var a=new Promise((t,a)=>r=o[e]=[t,a]);t.push(r[2]=a);var n=l.p+l.u(e),c=Error();l.l(n,function(t){if(l.o(o,e)&&(0!==(r=o[e])&&(o[e]=void 0),r)){var a=t&&("load"===t.type?"missing":t.type),n=t&&t.target&&t.target.src;c.message="Loading chunk "+e+" failed.\n("+a+": "+n+")",c.name="ChunkLoadError",c.type=a,c.request=n,r[1](c)}},"chunk-"+e,e)}else o[e]=0},l.O.j=e=>0===o[e],c=(e,t)=>{var r,a,[n,c,f]=t,i=0;if(n.some(e=>0!==o[e])){for(r in c)l.o(c,r)&&(l.m[r]=c[r]);if(f)var d=f(l)}for(e&&e(t);i<n.length;i++)a=n[i],l.o(o,a)&&o[a]&&o[a][0](),o[a]=0;return l.O(d)},(f=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_=self.\_\_LOADABLE\_LOADED\_CHUNKS\_\_||[]).forEach(c.bind(null,0)),f.push=c.bind(null,f.push.bind(f))})()
;(function(){
window.\_MODERNJS\_ROUTE\_MANIFEST = {"routeAssets":{"$":{"chunkIds":["6493","7756","7807","3234"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js","static/js/async/$.585a3f9198.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"main":{"chunkIds":["6408","6493","9783","9535","44","1889"],"assets":["static/js/lib-polyfill.378681f845.js","static/js/lib-react.27fe10ca75.js","static/js/lib-router.89b6789ef8.js","static/js/44.2384edeb97.js","static/js/main.29e80207a7.js","static/css/main.0a4ac522c6.css"],"referenceCssAssets":["static/css/main.0a4ac522c6.css"]},"page":{"chunkIds":["6493","7756","7807"],"assets":["static/js/lib-polyfill.378681f845.js","static/css/async/7756.ddb1faeff0.css","static/js/async/7756.25c2bba752.js","static/css/async/page.7da9e47967.css","static/js/async/page.d38bc8c689.js"],"referenceCssAssets":["static/css/async/7756.ddb1faeff0.css","static/css/async/page.7da9e47967.css"]},"rag-widget":{"chunkIds":["9150","3313"],"assets":["static/js/async/9150.a11152606a.js","static/js/async/rag-widget.023f1758d4.js","static/css/async/rag-widget.6b79098a88.css"],"referenceCssAssets":["static/css/async/rag-widget.6b79098a88.css"]}}};
})();
!function(n,t){if(n.LogAnalyticsObject=t,!n[t]){function c(){c.q.push(arguments)}c.q=c.q||[],n[t]=c}n[t].l=+new Date}(window,"collectEvent") 

[![TRAE](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png)

TRAE](https://www.trae.cn/)

[TRAE IDE](/ide_trae-overview)[TRAE Work](/work_what-is-trae-solo)[TRAE 插件](/plugin_what-is-trae-plugin)[TRAE CLI](/cli_what-is-trae-cli)[企业版](/ide_rules)

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

AI 编程核心/规则（Rule）

# 规则（Rule）

你可以通过制定规则来规范 AI 在 TRAE 内的行为，包括代码风格、语言与框架、交互方式等，使 AI 的输出更符合你的个人偏好和项目要求。

## 关于规则

### 应用场景

规则的主要应用场景如下：

* **提升效率**  
  将个人经验和项目要求转化为可复用的规则，一次配置可长期生效，减少与 AI 的沟通成本以及人工审校时间。
* **统一标准**  
  将团队规范、项目标准结构化为规则，使所有成员所负责的内容在风格、结构和质量上保持一致，避免偏差。
* **保障质量**  
  让 AI 明确项目的核心约束（架构设计、命名规范、代码风格等），避免常见错误。

### 规则类型

你可以配置两类规则：全局规则、项目规则。

| **规则类型** | **描述** |
| --- | --- |
| 全局规则 | 全局规则是基于个人使用习惯和需求为 AI 定制的规则，旨在让 AI 的输出更符合用户的个性化要求。全局规则在所有项目中生效。  以下为应用场景示例：   * **语言风格**：偏好简洁/严谨/幽默等表达方式。 * **操作系统**：提供针对 Windows 或 macOS 操作系统的回答。 * **内容深度**：是否需要详细解释、示例或仅需结论。 * **交互方式**：如倾向于直接答案，还是引导式提问。 |
| 项目规则 | 项目规则是针对当前项目 AI 需要遵循的规则，仅在所配置的项目中生效。  以下为应用场景示例：   * **代码风格**：缩进（空格/制表符）、命名规范（驼峰式/snake\_case）等。 * **语言与框架**：优先使用的编程语言（如 Python/JavaScript）或框架（如 React/Django）。 * **API 限定**：勿使用某些 API。 |

## 创建全局规则

根据个人习惯，创建一条或多条全局规则。AI 会在所有项目中遵守你创建的全局规则。

1. 在 IDE 模式界面中，点击界面右上角的 **设置** 图标，进入设置中心。  
   或  
   在 SOLO 模式界面中，点击对话面板右上角的 **设置** 图标，进入设置中心。
2. 在左侧导航栏中，选择 **规则**。  
   你将进入规则管理面板。
3. 在 **规则** 部分，点击 **+ 创建** 按钮，然后选择 **全局**。
4. 在规则输入框中，输入一条全局规则，然后点击 **保存** 按钮。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0893717f8443493d93590482e189c23a~tplv-goo7wpa0wc-topic.webp)  
   你所添加的全局规则将以列表的形式被展示。

## 创建项目规则

### 操作步骤

项目规则使用 Markdown 语法编写，仅在其被创建的项目中生效。  
在创建项目规则时，你可以指定规则的生效方式。根据生效方式的不同，系统会自动修改规则的 `alwaysApply` 属性，你还需要根据生效方式为规则配置 `description` 或 `globs` 属性。  
创建项目规则的步骤如下：

1. 打开一个项目。
2. 在 IDE 模式界面中，点击界面右上角的 **设置** 图标，进入设置中心。  
   或  
   在 SOLO 模式界面中，点击对话面板右上角的 **设置** 图标，进入设置中心。
3. 在左侧导航栏中，选择 **规则**。  
   你将进入规则管理面板。
4. 在 **规则** 部分，点击 **+ 创建** 按钮，然后选择 **项目**。
5. 在 **创建规则** 弹窗中，输入规则名称，然后点击 **确认** 按钮。  
   系统自动在该项目中创建 `.trae/rules` 文件夹，在该文件夹内创建你所命名的规则文件，并在编辑器中打开该规则文件的编辑窗口。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f5a7bddd54764c93a4677ac3ce9994ac~tplv-goo7wpa0wc-topic.webp)
6. 设置规则的 **生效方式**。

   | **生效方式** | **描述** |
   | --- | --- |
   | 始终生效 | 该规则在当前项目下的所有 AI 对话中生效。 |
   | 指定文件生效 | 该规则仅在匹配到 `globs` 字段中指定的文件时生效。当你在对话输入框中提及的文件与 `globs` 设置匹配时，该规则会自动生效。 |
   | 智能生效 | 根据你在 `description` 字段中为该规则添加的适用场景，由 AI 在对话中判断相关性并决定是否使用该规则。 |
   | 手动触发生效 | 仅当在对话中使用 #Rule 提及某个规则时，该规则才生效。 |
7. 根据规则的生效方式，在表单中设置相关属性。

   | **生效方式** | **属性设置** |
   | --- | --- |
   | 始终生效 | 下方的 `alwaysApply` 字段已被自动设置为 `true`。 |
   | 指定文件生效 | * `alwaysApply` 字段已被自动设置为 `false`。 * 在 **文件匹配模式** 处，使用通配符指定规则所作用的文件（例如 `*.js`、`src/**/*.ts`），可以配置多个通配符，中间用 `,` 分隔。该设置会被自动同步至下方的 `globs` 字段。 |
   | 智能生效 | * `alwaysApply` 字段已被自动设置为 `false`。 * 在 **描述** 处，填写该规则的适用场景，例如：`编写 React 组件的测试代码时，使用该规则`。 该设置会被自动同步至下方的 `description` 字段。 |
   | 手动触发生效 | 下方的 `alwaysApply` 字段已被自动设置为 `false`。 |
8. 在 `---` 下方，使用 Markdown 语法添加规则的内容。
9. 点击 **保存** 按钮。

### 关于多层规则嵌套

当项目根目录的规则较多时，各类规则全部平铺在 `.trae/rules/` 根目录下会导致查找和维护困难。  
你可以在 `.trae/rules/` 目录下创建子文件夹，将同类别的规则文件放置在相应的子文件夹中进行归类。系统会自动递归读取这些目录下的规则。目前至多支持 3 层嵌套。  
结构如下：

```
.trae/rules/                      
├── global-rules.md                
├── module-a/                                    # 第 1 层
│    ├── rules-a.md
│    ├── submodule-a1/                          # 第 2 层
│    │    └── rules-a1.md
│    └── submodule-a2/                          # 第 2 层
│          └── submodule-a2-b1/                 # 第 3 层
│                ├── rules-a2-b1.md             ← 最深可识别的层
│                └── submodule-a2-b1-c1/        # 第 4 层（无法识别）
│                      └── rule-a2-b1-c1.md     ← 超出限制（无法识别）
└── module-b/                                    # 第 1 层
     └── rules-b.md
```

### 关于为子目录创建规则

在一个大型项目中，通常包含多个文件夹，不同文件夹代表着不同的业务模块或技术栈。如果将所有规则（包括 AGENTS.md）都配置在项目根目录下，不仅难以维护，还有可能导致某个模块的专属规则对其他模块产生干扰。  
TRAE 支持读取项目中任意子目录下的 `.trae/rules/` 文件夹。如你只想为某个特定模块配置规则，可以直接将规则文件放到该模块文件夹下。当你在对话中提及该目录下的文件，或者 AI 在执行任务时读取了该目录下的文件时，系统就会自动携带并应用该目录下的专属规则。  
示例结构：

```
my-project/
├── .trae/
│    └── rules/                 # 项目根目录
│          └── global-style.md
├── frontend-module/             # 某个前端模块
│    ├── AGENTS.md              # 仅在 frontend-module 相关文件被读取/提及时生效
│    └── .trae/
│          └── rules/           # 仅在 frontend-module 相关文件被读取/提及时生效
│                └── react-best-practices.md
└── backend-module/              # 某个后端模块
     └── .trae/
           └── rules/            # 仅在 backend-module 相关文件被读取/提及时生效
                 └── api-design.md
```

## 在对话中引用规则

对于 “手动触发生效” 类型的规则，需在对话输入框中通过 #Rule 来引用。  
![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/c7d2e67549514623a7397106e8ab5609~tplv-goo7wpa0wc-topic.webp)

提示

规则引用方式中，#Rule 的优先级最高。对于生效方式为 “指定文件生效” 或 ”智能生效“ 的项目规则，若你在对话中通过 #Rule 提及这些规则，AI 也会在本次对话中使用它们。

## 编辑/删除规则

1. 在设置中心的 **规则** 列表中，找到目标规则。
2. 点右侧的 **设置** 图标。
3. 在菜单中选择 **编辑** 或 **删除**。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/6acc44feaa6a40e189ea0250f3da28ba~tplv-goo7wpa0wc-topic.webp)
4. 完成相应操作。

## 使用 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md

* **AGENTS.md**  
  AGENTS.md 是一个位于项目根目录的轻量级 Markdown 文件，用于向 AI 智能体提供行为指引。它通过直观、易读的文本描述，明确智能体在项目中需遵守的指令和规范。AGENTS.md 中定义的规则为项目级规则，仅在当前项目中生效。  
  在 TRAE 中创建的 AGENTS.md 文件可以在其他支持 AGENTS.md 的 IDE 中复用，反之亦然。
* **CLAUDE.md 和 CLAUDE.local.md**  
  TRAE 兼容 CLAUDE.md 和 CLAUDE.local.md。如果你已在 Claude Code 中创建项目并添加了 CLAUDE.md 和/或 CLAUDE.local.md，当将该项目导入 TRAE 时，这些文件会被一并导入。

若要使 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md 在 TRAE 中生效，使用以下步骤：

1. 前往 **设置** > **规则。**
2. 在 **导入设置** 处，打开 **将 AGENTS.md 包含在上下文中** 和 **将 CLAUDE.md 包含在上下文中** 开关。  
   开启后，智能体会读取根目录中的 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md 文件并将其添加到上下文中。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/e37e88ed62f743f0be7aa128ae5d748b~tplv-goo7wpa0wc-topic.webp)

## 为提交内容（Git Commit Message）设置规则

TRAE 支持为 AI 生成的提交内容设置规则，以确保其符合项目要求。你只需在规则文件中使用 `scene: git_message` 字段即可进行配置。  
`scene: git_message` 字段与 `alwaysApply`、`description` 和 `globs` 等现有字段兼容。只要规则文件中包含该字段，AI 在生成提交内容时都会遵循其中定义的规则，而不受其他字段配置的影响。  
如果项目中的多个规则文件均包含 `scene: git_message`，AI 会同时遵循这些文件中的规则。

### **方式一：在现有文件中添加规则**

1. 在当前项目中，打开一个已有的规则文件。
2. 在文件中添加 `scene` 字段，并将其设置为 `git_message`。
3. 在 `---` 分隔符下方添加具体的规则内容。  
   结构如下：

   ```
   ---
   scene: git_message
   ---
   正文：生成提交内容时应遵守的规范
   ```

### **方式二：在** **git-commit-message.md 文件中添加规则**

1. 在左侧导航栏中，点击 **源代码管理** 图标  
   你将进入 **源代码管理** 面板。
2. 在顶部提交内容输入框的右侧，点击下拉图标，然后在菜单中选择 **配置提交信息生成规则**。  
   系统自动在 `.trae/rules` 目录下生成 `git-commit-message.md` 文件。

   提示

   若你已在某个已有规则文件中配置了 `scene: git_message` 及对应规则，系统将直接打开该文件，而不会新建 `git-commit-message.md`。

   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/869be7f6ecc54147a51e2a65ae725bcc~tplv-goo7wpa0wc-topic.webp)
3. 在 `git-commit-message.md` 文件中，添加具体的规则内容。

### 如何让 AI 生成提交内容？

1. 打开 **源代码管理** 面板。
2. 点击 **生成提交内容** 按钮；或点击下拉图标，然后在菜单中选择 **自动生成提交内容**。  
   ![Image](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f0cbbea6e3d7404aa2ed3cb82ebd8b5d~tplv-goo7wpa0wc-topic.webp)

## 最佳实践

* 控制单条规则的内容粒度，避免在一条规则中包含过多信息，使其保持清晰、聚焦、易于理解。
* 各条规则之间不得彼此冲突或相互覆盖。
* 在指定文件路径时，使用相对于项目根目录的相对路径，以确保 AI 能准确定位文件。
* 引用规则时，优先选择与当前对话或任务强相关的规则。
* 新建或修改规则后，建议开启全新的对话再使用，以避免历史上下文与新规则产生冲突。
* 若项目中已有大量不符合规范的代码，模型可能会沿用现有代码风格而非遵循新规则。此时建议：
  + 明确向模型说明当前任务为“重构”；
  + 在特定场景中强制要求 AI 严格遵循新规则；
  + 启动专门的重构项目，逐步提升整体代码质量。

## 示例

### 不同应用场景的规则

基础交互
通用编码
重构
代码可读性
性能优化

* 所有回答都使用中文表述。
* 如需提供代码，为关键逻辑和可能造成理解困难的部分添加简明的中文注释。
* 当生成的代码超过 20 行时，优先考虑是否可以进行适当的抽象或聚合。

* 避免不必要的对象复制或克隆。
* 避免多层嵌套，提前返回。
* 使用适当的并发控制机制。

1. 小步重构：
   * 每次只做一个小改动，然后测试。
   * 频繁提交，保持代码随时可工作。
2. 测试保障：
   * 重构前确保有足够的测试。
   * 每次修改后运行测试，确保行为不变。
3. 代码审查：
   * 重构后进行代码审查，确保质量。

1. 命名约定：
   * 使用有意义的、描述性的名称。
   * 遵循项目或语言的命名规范。
   * 避免缩写和单字母变量（除非是约定俗成的，如循环中的 `i`）。
2. 代码组织：
   * 相关代码放在一起。
   * 函数只做一件事。
   * 保持适当的抽象层次。
3. 注释与文档：
   * 注释应该解释为什么，而不是做什么。
   * 为公共 API 提供清晰的文档。
   * 更新注释以反映代码变化。

1. 内存优化：
   * 避免不必要的对象创建。
   * 及时释放不再需要的资源。
   * 注意内存泄漏问题。
2. 计算优化：
   * 避免重复计算。
   * 使用适当的数据结构和算法。
   * 延迟计算直到必要时。
3. 并行优化：
   * 识别可并行化的任务。
   * 避免不必要的同步。
   * 注意线程安全问题。

### 项目规则多层嵌套

假设你的项目有很多前端设计和开发相关的规则，可以这样组织：

```
.trae/rules/
├── general-rules.md                 # 通用规则
├── frontend/
│    ├── react-best-practices.md    # React 规范
│    ├── css-naming.md              # CSS 命名规范
│    └── testing/
│         └── unit-test-rules.md    # 前端单测规范
├── backend/
│    ├── api-design.md              # API 设计规范
│    └── error-handling.md          # 错误处理规范
└── devops/
     └── ci-rules.md                 # CI/CD 相关规范
```

文档对您有帮助吗?

有帮助无帮助

[上一篇

技能（Skill）](/ide_skills)[下一篇

记忆](/ide_memories)

[关于规则](#2630133a "关于规则")

[应用场景](#1d11cf39 "应用场景")

[规则类型](#a1db0311 "规则类型")

[创建全局规则](#26337c87 "创建全局规则")

[创建项目规则](#cc1615b8 "创建项目规则")

[操作步骤](#abbdf6c3 "操作步骤")

[关于多层规则嵌套](#767a50c0 "关于多层规则嵌套")

[关于为子目录创建规则](#a9875dcf "关于为子目录创建规则")

[在对话中引用规则](#e536cbfb "在对话中引用规则")

[编辑/删除规则](#e6a0cd08 "编辑/删除规则")

[使用 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md](#9eba52ae "使用 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md")

[为提交内容（Git Commit Message）设置规则](#8fb2ba68 "为提交内容（Git Commit Message）设置规则")

[方式一：在现有文件中添加规则](#fd66da01 "方式一：在现有文件中添加规则")

[方式二：在 git-commit-message.md 文件中添加规则](#ef324fd4 "方式二：在 git-commit-message.md 文件中添加规则")

[如何让 AI 生成提交内容？](#0f3cd4bb "如何让 AI 生成提交内容？")

[最佳实践](#52aaae5d "最佳实践")

[示例](#44157d4f "示例")

[不同应用场景的规则](#371e47bc "不同应用场景的规则")

[项目规则多层嵌套](#3fb4c21e "项目规则多层嵌套")

window.collectEvent("init",{app\_id:945902,disable\_auto\_pv:!0,channel:"cn"}),window.collectEvent("config",{platform\_env:"renderer",platform\_host:"undefined"!=typeof location?location.host:""}),window.collectEvent("start")["6493","7756","7807","3234","9150","3313"]{"namedChunks":["$","rag-widget"]}window.\_SSR\_DATA = {"data":{},"context":{"request":{"params":{},"query":{},"pathname":"\u002Fide\_rules","host":"docs.trae.cn","url":"https:\u002F\u002Fdocs.trae.cn\u002Fide\_rules"},"reporter":{}},"mode":"string","renderLevel":2}
window.\_ROUTER\_DATA = {"loaderData":{"layout":{"prefectLang":"zh","url":"http:\u002F\u002Fdocs.trae.cn\u002Fide\_rules","env":"canary"},"$":{"code":0,"data":{"basePath":"\u002F","doc":{"tab\_id":"67a5b43a9ae5aa03545c7a07","path":"ide\_rules","\_id":"6a2a99737d55f901e2b4b298","title":"规则（Rule）","content":"你可以通过制定规则来规范 AI 在 TRAE 内的行为，包括代码风格、语言与框架、交互方式等，使 AI 的输出更符合你的个人偏好和项目要求。\n## 关于规则 {#2630133a}\n### 应用场景 {#1d11cf39}\n规则的主要应用场景如下：\n\n\* \*\*提升效率\*\*\n 将个人经验和项目要求转化为可复用的规则，一次配置可长期生效，减少与 AI 的沟通成本以及人工审校时间。\n\* \*\*统一标准\*\*\n 将团队规范、项目标准结构化为规则，使所有成员所负责的内容在风格、结构和质量上保持一致，避免偏差。\n\* \*\*保障质量\*\*\n 让 AI 明确项目的核心约束（架构设计、命名规范、代码风格等），避免常见错误。\n\n### 规则类型 {#a1db0311}\n你可以配置两类规则：全局规则、项目规则。\n\u003C!-- @cols-width: 100,728 --\u003E\n| | | \\\n|\*\*规则类型\*\* |\*\*描述\*\* |\n|---|---|\n| | | \\\n|全局规则 |全局规则是基于个人使用习惯和需求为 AI 定制的规则，旨在让 AI 的输出更符合用户的个性化要求。全局规则在所有项目中生效。 |\\\n| |以下为应用场景示例： |\\\n| | |\\\n| |\* \*\*语言风格\*\*：偏好简洁\u002F严谨\u002F幽默等表达方式。 |\\\n| |\* \*\*操作系统\*\*：提供针对 Windows 或 macOS 操作系统的回答。 |\\\n| |\* \*\*内容深度\*\*：是否需要详细解释、示例或仅需结论。 |\\\n| |\* \*\*交互方式\*\*：如倾向于直接答案，还是引导式提问。 |\n| | | \\\n|项目规则 |项目规则是针对当前项目 AI 需要遵循的规则，仅在所配置的项目中生效。 |\\\n| |以下为应用场景示例： |\\\n| | |\\\n| |\* \*\*代码风格\*\*：缩进（空格\u002F制表符）、命名规范（驼峰式\u002Fsnake\_case）等。 |\\\n| |\* \*\*语言与框架\*\*：优先使用的编程语言（如 Python\u002FJavaScript）或框架（如 React\u002FDjango）。 |\\\n| |\* \*\*API 限定\*\*：勿使用某些 API。 |\n\n## 创建全局规则 {#26337c87}\n根据个人习惯，创建一条或多条全局规则。AI 会在所有项目中遵守你创建的全局规则。\n\n1. 在 IDE 模式界面中，点击界面右上角的 \*\*设置\*\* 图标，进入设置中心。\n 或\n 在 SOLO 模式界面中，点击对话面板右上角的 \*\*设置\*\* 图标，进入设置中心。\n2. 在左侧导航栏中，选择 \*\*规则\*\*。\n 你将进入规则管理面板。\n3. 在 \*\*规则\*\* 部分，点击 \*\*+ 创建\*\* 按钮，然后选择 \*\*全局\*\*。\n4. 在规则输入框中，输入一条全局规则，然后点击 \*\*保存\*\* 按钮。\n ![Image=700x322](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F0893717f8443493d93590482e189c23a~tplv-goo7wpa0wc-image.image)\n 你所添加的全局规则将以列表的形式被展示。\n\n## 创建项目规则 {#cc1615b8}\n### 操作步骤 {#abbdf6c3}\n项目规则使用 Markdown 语法编写，仅在其被创建的项目中生效。\n在创建项目规则时，你可以指定规则的生效方式。根据生效方式的不同，系统会自动修改规则的 `alwaysApply` 属性，你还需要根据生效方式为规则配置 `description` 或 `globs` 属性。\n创建项目规则的步骤如下：\n\n1. 打开一个项目。\n2. 在 IDE 模式界面中，点击界面右上角的 \*\*设置\*\* 图标，进入设置中心。\n 或\n 在 SOLO 模式界面中，点击对话面板右上角的 \*\*设置\*\* 图标，进入设置中心。\n3. 在左侧导航栏中，选择 \*\*规则\*\*。\n 你将进入规则管理面板。\n4. 在 \*\*规则\*\* 部分，点击 \*\*+ 创建\*\* 按钮，然后选择 \*\*项目\*\*。\n5. 在 \*\*创建规则\*\* 弹窗中，输入规则名称，然后点击 \*\*确认\*\* 按钮。\n 系统自动在该项目中创建 `.trae\u002Frules` 文件夹，在该文件夹内创建你所命名的规则文件，并在编辑器中打开该规则文件的编辑窗口。\n ![Image=2932x943](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Ff5a7bddd54764c93a4677ac3ce9994ac~tplv-goo7wpa0wc-image.image)\n6. 设置规则的 \*\*生效方式\*\*。\n \u003C!-- @cols-width: 123,718 --\u003E\n | | | \\\n |\*\*生效方式\*\* |\*\*描述\*\* |\n |---|---|\n | | | \\\n |始终生效 |该规则在当前项目下的所有 AI 对话中生效。 |\n | | | \\\n |指定文件生效 |该规则仅在匹配到 `globs` 字段中指定的文件时生效。当你在对话输入框中提及的文件与 `globs` 设置匹配时，该规则会自动生效。 |\n | | | \\\n |智能生效 |根据你在 `description` 字段中为该规则添加的适用场景，由 AI 在对话中判断相关性并决定是否使用该规则。 |\n | | | \\\n |手动触发生效 |仅当在对话中使用 #Rule 提及某个规则时，该规则才生效。 |\n\n7. 根据规则的生效方式，在表单中设置相关属性。\n \u003C!-- @cols-width: 131,707 --\u003E\n | | | \\\n |\*\*生效方式\*\* |\*\*属性设置\*\* |\n |---|---|\n | | | \\\n |始终生效 |下方的 `alwaysApply` 字段已被自动设置为 `true`。 |\n | | | \\\n |指定文件生效 |\* `alwaysApply` 字段已被自动设置为 `false`。 |\\\n | |\* 在 \*\*文件匹配模式\*\* 处，使用通配符指定规则所作用的文件（例如 `\*.js`、`src\u002F\*\*\u002F\*.ts`），可以配置多个通配符，中间用 `,` 分隔。该设置会被自动同步至下方的 `globs` 字段。 |\n | | | \\\n |智能生效 |\* `alwaysApply` 字段已被自动设置为 `false`。 |\\\n | |\* 在 \*\*描述\*\* 处，填写该规则的适用场景，例如：`编写 React 组件的测试代码时，使用该规则`。 该设置会被自动同步至下方的 `description` 字段。 |\n | | | \\\n |手动触发生效 |下方的 `alwaysApply` 字段已被自动设置为 `false`。 |\n\n8. 在 `---` 下方，使用 Markdown 语法添加规则的内容。\n9. 点击 \*\*保存\*\* 按钮。\n\n### 关于多层规则嵌套 {#767a50c0}\n当项目根目录的规则较多时，各类规则全部平铺在 `.trae\u002Frules\u002F` 根目录下会导致查找和维护困难。 \n你可以在 `.trae\u002Frules\u002F` 目录下创建子文件夹，将同类别的规则文件放置在相应的子文件夹中进行归类。系统会自动递归读取这些目录下的规则。目前至多支持 3 层嵌套。\n结构如下：\n```Plain Text\n.trae\u002Frules\u002F \n├── global-rules.md \n├── module-a\u002F # 第 1 层\n│ ├── rules-a.md\n│ ├── submodule-a1\u002F # 第 2 层\n│ │ └── rules-a1.md\n│ └── submodule-a2\u002F # 第 2 层\n│ └── submodule-a2-b1\u002F # 第 3 层\n│ ├── rules-a2-b1.md ← 最深可识别的层\n│ └── submodule-a2-b1-c1\u002F # 第 4 层（无法识别）\n│ └── rule-a2-b1-c1.md ← 超出限制（无法识别）\n└── module-b\u002F # 第 1 层\n └── rules-b.md\n```\n\n### 关于为子目录创建规则 {#a9875dcf}\n在一个大型项目中，通常包含多个文件夹，不同文件夹代表着不同的业务模块或技术栈。如果将所有规则（包括 AGENTS.md）都配置在项目根目录下，不仅难以维护，还有可能导致某个模块的专属规则对其他模块产生干扰。\nTRAE 支持读取项目中任意子目录下的 `.trae\u002Frules\u002F` 文件夹。如你只想为某个特定模块配置规则，可以直接将规则文件放到该模块文件夹下。当你在对话中提及该目录下的文件，或者 AI 在执行任务时读取了该目录下的文件时，系统就会自动携带并应用该目录下的专属规则。\n示例结构：\n```Plain Text\nmy-project\u002F\n├── .trae\u002F\n│ └── rules\u002F # 项目根目录\n│ └── global-style.md\n├── frontend-module\u002F # 某个前端模块\n│ ├── AGENTS.md # 仅在 frontend-module 相关文件被读取\u002F提及时生效\n│ └── .trae\u002F\n│ └── rules\u002F # 仅在 frontend-module 相关文件被读取\u002F提及时生效\n│ └── react-best-practices.md\n└── backend-module\u002F # 某个后端模块\n └── .trae\u002F\n └── rules\u002F # 仅在 backend-module 相关文件被读取\u002F提及时生效\n └── api-design.md\n```\n\n## 在对话中引用规则 {#e536cbfb}\n对于 “手动触发生效” 类型的规则，需在对话输入框中通过 #Rule 来引用。\n![Image=700x323](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Fc7d2e67549514623a7397106e8ab5609~tplv-goo7wpa0wc-image.image)\n:::tip 提示\n规则引用方式中，#Rule 的优先级最高。对于生效方式为 “指定文件生效” 或 ”智能生效“ 的项目规则，若你在对话中通过 #Rule 提及这些规则，AI 也会在本次对话中使用它们。\n:::\n## 编辑\u002F删除规则 {#e6a0cd08}\n\n1. 在设置中心的 \*\*规则\*\* 列表中，找到目标规则。\n2. 点右侧的 \*\*设置\*\* 图标。\n3. 在菜单中选择 \*\*编辑\*\* 或 \*\*删除\*\*。\n ![Image=700x144](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F6acc44feaa6a40e189ea0250f3da28ba~tplv-goo7wpa0wc-image.image)\n4. 完成相应操作。\n\n## 使用 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md {#9eba52ae}\n\n\* \*\*AGENTS.md\*\*\n AGENTS.md 是一个位于项目根目录的轻量级 Markdown 文件，用于向 AI 智能体提供行为指引。它通过直观、易读的文本描述，明确智能体在项目中需遵守的指令和规范。AGENTS.md 中定义的规则为项目级规则，仅在当前项目中生效。\n 在 TRAE 中创建的 AGENTS.md 文件可以在其他支持 AGENTS.md 的 IDE 中复用，反之亦然。\n\* \*\*CLAUDE.md 和 CLAUDE.local.md\*\*\n TRAE 兼容 CLAUDE.md 和 CLAUDE.local.md。如果你已在 Claude Code 中创建项目并添加了 CLAUDE.md 和\u002F或 CLAUDE.local.md，当将该项目导入 TRAE 时，这些文件会被一并导入。\n\n若要使 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md 在 TRAE 中生效，使用以下步骤：\n\n1. 前往 \*\*设置\*\* \u003E \*\*规则。\*\*\n2. 在 \*\*导入设置\*\* 处，打开 \*\*将 AGENTS.md 包含在上下文中\*\* 和 \*\*将 CLAUDE.md 包含在上下文中\*\* 开关。\n 开启后，智能体会读取根目录中的 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md 文件并将其添加到上下文中。\n ![Image=650x181](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Fe37e88ed62f743f0be7aa128ae5d748b~tplv-goo7wpa0wc-image.image)\n\n## 为提交内容（Git Commit Message）设置规则 {#8fb2ba68}\nTRAE 支持为 AI 生成的提交内容设置规则，以确保其符合项目要求。你只需在规则文件中使用 `scene: git\_message` 字段即可进行配置。\n`scene: git\_message` 字段与 `alwaysApply`、`description` 和 `globs` 等现有字段兼容。只要规则文件中包含该字段，AI 在生成提交内容时都会遵循其中定义的规则，而不受其他字段配置的影响。\n如果项目中的多个规则文件均包含 `scene: git\_message`，AI 会同时遵循这些文件中的规则。\n### \*\*方式一：在现有文件中添加规则\*\* {#fd66da01}\n\n1. 在当前项目中，打开一个已有的规则文件。\n2. 在文件中添加 `scene` 字段，并将其设置为 `git\_message`。\n3. 在 `---` 分隔符下方添加具体的规则内容。\n 结构如下：\n ```Markdown\n ---\n scene: git\_message\n ---\n 正文：生成提交内容时应遵守的规范\n ```\n\n\n### \*\*方式二：在\*\* \*\*git-commit-message.md 文件中添加规则\*\* {#ef324fd4}\n\n1. 在左侧导航栏中，点击 \*\*源代码管理\*\* 图标\n 你将进入 \*\*源代码管理\*\* 面板。\n2. 在顶部提交内容输入框的右侧，点击下拉图标，然后在菜单中选择 \*\*配置提交信息生成规则\*\*。\n 系统自动在 `.trae\u002Frules` 目录下生成 `git-commit-message.md` 文件。\n :::tip 提示\n 若你已在某个已有规则文件中配置了 `scene: git\_message` 及对应规则，系统将直接打开该文件，而不会新建 `git-commit-message.md`。\n :::\n ![Image=3026x1265](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002F869be7f6ecc54147a51e2a65ae725bcc~tplv-goo7wpa0wc-image.image)\n3. 在 `git-commit-message.md` 文件中，添加具体的规则内容。\n\n### 如何让 AI 生成提交内容？ {#0f3cd4bb}\n\n1. 打开 \*\*源代码管理\*\* 面板。\n2. 点击 \*\*生成提交内容\*\* 按钮；或点击下拉图标，然后在菜单中选择 \*\*自动生成提交内容\*\*。\n ![Image=500x177](https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Ff0cbbea6e3d7404aa2ed3cb82ebd8b5d~tplv-goo7wpa0wc-image.image)\n\n## 最佳实践 {#52aaae5d}\n\n\* 控制单条规则的内容粒度，避免在一条规则中包含过多信息，使其保持清晰、聚焦、易于理解。\n\* 各条规则之间不得彼此冲突或相互覆盖。\n\* 在指定文件路径时，使用相对于项目根目录的相对路径，以确保 AI 能准确定位文件。\n\* 引用规则时，优先选择与当前对话或任务强相关的规则。\n\* 新建或修改规则后，建议开启全新的对话再使用，以避免历史上下文与新规则产生冲突。\n\* 若项目中已有大量不符合规范的代码，模型可能会沿用现有代码风格而非遵循新规则。此时建议：\n \* 明确向模型说明当前任务为“重构”；\n \* 在特定场景中强制要求 AI 严格遵循新规则；\n \* 启动专门的重构项目，逐步提升整体代码质量。\n\n## 示例 {#44157d4f}\n### 不同应用场景的规则 {#371e47bc}\n\n:::: tabs\n@tab 基础交互\n\* 所有回答都使用中文表述。\n\* 如需提供代码，为关键逻辑和可能造成理解困难的部分添加简明的中文注释。\n\* 当生成的代码超过 20 行时，优先考虑是否可以进行适当的抽象或聚合。\n\n@tab 通用编码\n\* 避免不必要的对象复制或克隆。\n\* 避免多层嵌套，提前返回。\n\* 使用适当的并发控制机制。\n\n@tab 重构\n1. 小步重构：\n \* 每次只做一个小改动，然后测试。\n \* 频繁提交，保持代码随时可工作。\n2. 测试保障：\n \* 重构前确保有足够的测试。\n \* 每次修改后运行测试，确保行为不变。\n3. 代码审查：\n \* 重构后进行代码审查，确保质量。\n\n@tab 代码可读性\n1. 命名约定：\n \* 使用有意义的、描述性的名称。\n \* 遵循项目或语言的命名规范。\n \* 避免缩写和单字母变量（除非是约定俗成的，如循环中的 `i`）。\n2. 代码组织：\n \* 相关代码放在一起。\n \* 函数只做一件事。\n \* 保持适当的抽象层次。\n3. 注释与文档：\n \* 注释应该解释为什么，而不是做什么。\n \* 为公共 API 提供清晰的文档。\n \* 更新注释以反映代码变化。\n\n@tab 性能优化\n1. 内存优化：\n \* 避免不必要的对象创建。\n \* 及时释放不再需要的资源。\n \* 注意内存泄漏问题。\n2. 计算优化：\n \* 避免重复计算。\n \* 使用适当的数据结构和算法。\n \* 延迟计算直到必要时。\n3. 并行优化：\n \* 识别可并行化的任务。\n \* 避免不必要的同步。\n \* 注意线程安全问题。\n\n::::\n\n### 项目规则多层嵌套 {#3fb4c21e}\n假设你的项目有很多前端设计和开发相关的规则，可以这样组织：\n```Plain Text\n.trae\u002Frules\u002F\n├── general-rules.md # 通用规则\n├── frontend\u002F\n│ ├── react-best-practices.md # React 规范\n│ ├── css-naming.md # CSS 命名规范\n│ └── testing\u002F\n│ └── unit-test-rules.md # 前端单测规范\n├── backend\u002F\n│ ├── api-design.md # API 设计规范\n│ └── error-handling.md # 错误处理规范\n└── devops\u002F\n └── ci-rules.md # CI\u002FCD 相关规范\n```\n\n\n","type":"doc","created\_at":"2026-06-11T11:18:11.074Z","updated\_at":"2026-06-11T11:18:11.074Z"},"tabs":[{"\_id":"67a5b43a9ae5aa03545c7a07","name":"TRAE IDE","doc\_path":"ide\_trae-overview","sort":1738912826317000},{"\_id":"69ae930b9e3a5d0550e655c6","name":"TRAE Work","doc\_path":"work\_what-is-trae-solo","sort":1742260835606000},{"\_id":"67f399815eb9ea04ed5a0dc2","name":"TRAE 插件","doc\_path":"plugin\_what-is-trae-plugin","sort":1744017793008000},{"\_id":"69393503cb3f7404dd1ba797","name":"TRAE CLI","doc\_path":"cli\_what-is-trae-cli","sort":1765356803650000},{"\_id":"6a56350b17d05701c37b7df4","name":"企业版","doc\_path":null,"type":"group","sort":1777277513227100},{"\_id":"69ef1a491b2d8604fb497803","name":"用户指南","doc\_path":"enterprise\_trae-enterprise-edition-overview","parent\_id":"6a56350b17d05701c37b7df4","sort":1784034631531900},{"\_id":"6a56354717d05701c37b7e45","name":"API 参考","doc\_path":"enterprise\_trae-cn-enterprise-api","parent\_id":"6a56350b17d05701c37b7df4","type":"common","sort":1784034631532000}],"menus":[{"\_id":"6a4dc0de4bdbc784e33c6fec","doc\_release\_id":"6a587c483d87c401e4c3f5e4","hidden":false,"parent\_id":null,"path":"ide\_trae-overview","sort":1780912445574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE 概览"},{"\_id":"6a27b7bf4bdbc784e337fba3","doc\_release\_id":"6a69bb5c31547d01b9f85ac7","hidden":false,"parent\_id":null,"path":"ide\_trae-solo-is-now-available","sort":1780949588013500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重磅更新：TRAE Work 客户端上线"},{"\_id":"6a27b7bf4bdbc784e337fbaf","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730457000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"入门"},{"\_id":"6a27b7bf4bdbc784e337fbc2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730462000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"教程 & 最佳实践"},{"\_id":"6a66d8394bdbc784e314a365","hidden":false,"parent\_id":null,"path":null,"sort":1780986730469000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"最新动态","doc\_release\_id":null},{"\_id":"6a27b7bf4bdbc784e337fbc6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730476000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程核心"},{"\_id":"6a27b7bf4bdbc784e337fbf2","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730477000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式"},{"\_id":"6a27b7bf4bdbc784e337fbf6","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730479000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具与插件"},{"\_id":"6a27b7bf4bdbc784e337fc12","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730486000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作环境"},{"\_id":"6a27b7bf4bdbc784e337fc22","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730491000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置"},{"\_id":"6a27b7bf4bdbc784e337fc26","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730492000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益"},{"\_id":"6a27b7bf4bdbc784e337fc54","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730503000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"问题排查"},{"\_id":"6a27b7bf4bdbc784e337fc5b","doc\_release\_id":"6a394f1addf14401b2a89a64","hidden":false,"parent\_id":null,"path":"ide\_contact-us","sort":1780986730507000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"联系我们"},{"\_id":"6a27b7bf4bdbc784e337fc61","doc\_release\_id":null,"hidden":false,"parent\_id":null,"path":null,"sort":1780986730508000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"相关协议"},{"\_id":"6a27b7bf4bdbc784e337fbb3","doc\_release\_id":"6a57252ad0270601e250743f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_what-is-trae","sort":1780986730455000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"什么是 TRAE IDE？"},{"\_id":"6a27b7bf4bdbc784e337fbb7","doc\_release\_id":"6a60bfded0dfed01aa9be4ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_get-started-with-trae","sort":1780986730458000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快速开始"},{"\_id":"6a27b7bf4bdbc784e337fbba","doc\_release\_id":"6a2a99737d55f901e2b4b294","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_device-limit","sort":1780986730459000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"设备数量限制"},{"\_id":"6a27b7bf4bdbc784e337fbbe","doc\_release\_id":"6a63745a6c585801d078a7c2","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbaf","path":"ide\_changelog","sort":1780986730461000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"更新日志"},{"\_id":"6a27b7bf4bdbc784e337fba5","doc\_release\_id":"6a435d8142bb2101b15d8c07","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_trae-editor-for-unity-tutorial","sort":1780986730509900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"TRAE Editor for Unity：让 AI 融入 Unity 开发工作流"},{"\_id":"6a27b7bf4bdbc784e337fc68","doc\_release\_id":"6a2a99737d55f901e2b4b2ae","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_top-10-recommended-skills-for-development-scenarios","sort":1780986730510000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"研发场景十大热门 Skill 推荐"},{"\_id":"6a27b7bf4bdbc784e337fc70","doc\_release\_id":"6a2a99737d55f901e2b4b2b0","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_best-practice-for-how-to-write-a-good-skill","sort":1780986730512000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"如何写好一个 Skill：从创建到迭代的最佳实践"},{"\_id":"6a27b7bf4bdbc784e337fc73","doc\_release\_id":"6a2a99737d55f901e2b4b2b1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_most-used-mcp-servers-in-trae","sort":1780986730513000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"热门 MCP Server 详解"},{"\_id":"6a27b7bf4bdbc784e337fc7d","doc\_release\_id":"6a2a99737d55f901e2b4b2b3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_custom-agents-ready-for-one-click-import","sort":1780986730516000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"支持一键导入的自定义智能体"},{"\_id":"6a27b7bf4bdbc784e337fc80","doc\_release\_id":"6a2a99737d55f901e2b4b2b4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_ai-coding-case-streams-to-river","sort":1780986730517000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"AI 编程实践：“积流成江” 的开发故事"},{"\_id":"6a27b7bf4bdbc784e337fc84","doc\_release\_id":"6a2a99737d55f901e2b4b2b5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-figma","sort":1780986730518000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：将 Figma 设计稿转化为前端代码"},{"\_id":"6a27b7bf4bdbc784e337fca2","doc\_release\_id":"6a2a99737d55f901e2b4b2bb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-playwright","sort":1780986730526000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：实现网页自动化测试"},{"\_id":"6a27b7bf4bdbc784e337fca5","doc\_release\_id":"6a2a99737d55f901e2b4b2bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc2","path":"ide\_tutorial-mcp-amap","sort":1780986730527000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 教程：使用高德地图 MCP Server 规划行程"},{"\_id":"6a27b7bf4bdbc784e337fbc9","doc\_release\_id":"6a30083104efdb01aa0e3acb","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_chat","sort":1780986730463000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"对话"},{"\_id":"6a27b7bf4bdbc784e337fbcd","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730464000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型"},{"\_id":"6a27b7bf4bdbc784e337fbd3","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730466000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文"},{"\_id":"6a27b7bf4bdbc784e337fbd6","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730467000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体（Agent）"},{"\_id":"6a27b7bf4bdbc784e337fbd9","doc\_release\_id":"6a43adb274518b01bb2b602d","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_skills","sort":1780986730468000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"技能（Skill）"},{"\_id":"6a27b7bf4bdbc784e337fbdf","doc\_release\_id":"6a2a99737d55f901e2b4b298","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_rules","sort":1780986730470000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"规则（Rule）"},{"\_id":"6a27b7bf4bdbc784e337fbe2","doc\_release\_id":"6a43843cb81ed601bad58c35","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_memories","sort":1780986730471000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"记忆"},{"\_id":"6a27b7bf4bdbc784e337fbe7","doc\_release\_id":"6a435d9695138601b04b1aa9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_slash-commands","sort":1780986730472000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"命令"},{"\_id":"6a2bed994bdbc784e3b39779","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"钩子（Hook）"},{"\_id":"6a27b7bf4bdbc784e337fbec","doc\_release\_id":"6a2a99737d55f901e2b4b29b","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_cue","sort":1780986730473250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"超级代码补全：CUE"},{"\_id":"6a6701dd4bdbc784e31fe0f1","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730473375,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批","doc\_release\_id":null},{"\_id":"6a435cb64bdbc784e33d8105","doc\_release\_id":"6a6067cee1be3e01a9085e57","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_spec-and-plan-workflows","sort":1780986730473500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置工作流：Plan、Spec 与 Goal"},{"\_id":"6a5e13b84bdbc784e379d139","doc\_release\_id":"6a5e173544d11701b082c1f7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":"ide\_browser-use","sort":1780986730474250,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"浏览器控制"},{"\_id":"6a27b7bf4bdbc784e337fbee","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbc6","path":null,"sort":1780986730475000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"代码质量"},{"\_id":"6a27b7bf4bdbc784e337fc04","doc\_release\_id":"6a5995bc6d002301b9c31436","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_models","sort":1780986730482000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置模型 & 自定义模型"},{"\_id":"6a27b7bf4bdbc784e337fd07","doc\_release\_id":"6a599631cb530701b9ea62d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbcd","path":"ide\_auto-mode","sort":1780986730555000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Auto 模式"},{"\_id":"6a27b7bf4bdbc784e337fc88","doc\_release\_id":"6a2a99737d55f901e2b4b2b6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_basic-usage-of-context","sort":1780986730520000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"基础用法"},{"\_id":"6a27b7bf4bdbc784e337fc96","doc\_release\_id":"6a2a99737d55f901e2b4b2b8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_number-sign","sort":1780986730523000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 # 符号引用上下文"},{"\_id":"6a27b7bf4bdbc784e337fc99","doc\_release\_id":"6a2a99737d55f901e2b4b2b9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_codebase-indexing","sort":1780986730524000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工作区代码索引"},{"\_id":"6a27b7bf4bdbc784e337fc9f","doc\_release\_id":"6a2a99737d55f901e2b4b2ba","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_ignore-files","sort":1780986730525000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"忽略文件"},{"\_id":"6a27b7bf4bdbc784e337fd24","doc\_release\_id":"6a2a9d567d55f901e2b4b7ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd3","path":"ide\_context-compaction","sort":1780986730562000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"上下文压缩"},{"\_id":"6a27b7bf4bdbc784e337fcfb","doc\_release\_id":"6a435dc03e465301b37694fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent-overview","sort":1780986730551000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能体概述"},{"\_id":"6a27b7bf4bdbc784e337fd11","doc\_release\_id":"6a69e3f71eefd201b2ba0e7f","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_built-in-agent","sort":1780986730552000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"内置智能体：Agent"},{"\_id":"6a27b7bf4bdbc784e337fd00","doc\_release\_id":"6a4e00bf8a804d01b3e42035","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_agent","sort":1780986730553000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"创建并管理自定义智能体"},{"\_id":"6a3be0874bdbc784e3da357d","doc\_release\_id":"6a435cac3e465301b3769451","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_subagents","sort":1780986730553500,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"子智能体（Subagent）"},{"\_id":"6a27b7bf4bdbc784e337fd04","doc\_release\_id":"6a3a2f8818b37b01bc6660ec","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbd6","path":"ide\_auto-run-and-security","sort":1780986730554000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自动运行 & 安全性"},{"\_id":"6a27b7bf4bdbc784e337fd97","doc\_release\_id":"6a2a99737d55f901e2b4b2f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_agent-powered-code-review","sort":1780986730594000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"智能代码审查"},{"\_id":"6a27b7bf4bdbc784e337fd9a","doc\_release\_id":"6a2a99737d55f901e2b4b2f5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbee","path":"ide\_refactoring-insights","sort":1780986730596000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"重构洞察"},{"\_id":"6a27b7bf4bdbc784e337fd0d","doc\_release\_id":"6a435ccf3e465301b3769497","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_solo-mode","sort":1780986730557000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"SOLO 模式概览"},{"\_id":"6a27b7bf4bdbc784e337fd18","doc\_release\_id":"6a2a99737d55f901e2b4b2d5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_task-management","sort":1780986730559000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"多任务并行"},{"\_id":"6a27b7bf4bdbc784e337fd1b","doc\_release\_id":"6a435cdb42bb2101b15d8bca","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_tool-panel","sort":1780986730560000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"工具面板"},{"\_id":"6a27b7bf4bdbc784e337fd21","doc\_release\_id":"6a2a99737d55f901e2b4b2d7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf2","path":"ide\_figma-to-code","sort":1780986730561000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Figma 设计还原"},{"\_id":"6a27b7bf4bdbc784e337fc8c","doc\_release\_id":null,"hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":null,"sort":1780986730521000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"模型上下文协议（MCP）"},{"\_id":"6a27b7bf4bdbc784e337fc90","doc\_release\_id":"6a2a99737d55f901e2b4b2b7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fbf6","path":"ide\_manage-extensions","sort":1780986730522000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"插件"},{"\_id":"6a27b7bf4bdbc784e337fc16","doc\_release\_id":"6a2beedc73064f01baed0009","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_wsl","sort":1780986730487000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 WSL 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1b","doc\_release\_id":"6a2beefce1e9a201bbc6b5fc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_ssh-remote","sort":1780986730488000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 SSH 进行远程开发"},{"\_id":"6a27b7bf4bdbc784e337fc1e","doc\_release\_id":"6a69cae41eefd201b2b9fd3e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc12","path":"ide\_sandbox","sort":1780986730490000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"(Legacy) 沙箱"},{"\_id":"6a27b7bf4bdbc784e337fc2a","doc\_release\_id":"6a2a99737d55f901e2b4b2a3","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_ide-settings","sort":1780986730493000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"IDE 设置总览"},{"\_id":"6a27b7bf4bdbc784e337fc2d","doc\_release\_id":"6a2a99737d55f901e2b4b2a4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_keyboard-shortcuts","sort":1780986730494000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"快捷键"},{"\_id":"6a27b7bf4bdbc784e337fc32","doc\_release\_id":"6a2a99737d55f901e2b4b2a5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_source-control","sort":1780986730496000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"源代码管理"},{"\_id":"6a27b7bf4bdbc784e337fc36","doc\_release\_id":"6a2a99737d55f901e2b4b2a6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_mark-for-ai-use","sort":1780986730497000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"终端：标记为 AI 使用"},{"\_id":"6a27b7bf4bdbc784e337fc3c","doc\_release\_id":"6a2a99737d55f901e2b4b2a7","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_resource-explorer","sort":1780986730498000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"进程资源管理器"},{"\_id":"6a27b7bf4bdbc784e337fc40","doc\_release\_id":"6a2a99737d55f901e2b4b2a8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc22","path":"ide\_privacy-mode","sort":1780986730499000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"隐私模式"},{"\_id":"6a27b7bf4bdbc784e337fda7","doc\_release\_id":"6a3fc9e7c078e201ba51b2aa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_fast-pass-overview","sort":1780986730600000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"“速通” 权益概览"},{"\_id":"6a27b7bf4bdbc784e337fdac","doc\_release\_id":"6a4747342877b801c43145bc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_susbcription-management","sort":1780986730601000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"管理 “速通” 权益订阅"},{"\_id":"6a27b7bf4bdbc784e337fdb0","doc\_release\_id":"6a2aa42a76fca701e31edf80","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_use-fast-pass","sort":1780986730603000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"使用 “速通“ 权益"},{"\_id":"6a27b7bf4bdbc784e337fdb3","doc\_release\_id":"6a2a99737d55f901e2b4b2fa","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc26","path":"ide\_confirmation-letter-for-vat-general-invoices","sort":1780986730604000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"增值税普通发票确认书"},{"\_id":"6a27b7bf4bdbc784e337fd28","doc\_release\_id":"6a4334713e465301b376912e","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_get-logs-or-session-id","sort":1780986730563000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"获取日志或 SessionID"},{"\_id":"6a27b7bf4bdbc784e337fd2c","doc\_release\_id":"6a2a99737d55f901e2b4b2da","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-general-issues","sort":1780986730564000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"常规问题"},{"\_id":"6a27b7bf4bdbc784e337fd30","doc\_release\_id":"6a2a99737d55f901e2b4b2db","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_error-codes","sort":1780986730565000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"错误码"},{"\_id":"6a27b7bf4bdbc784e337fd33","doc\_release\_id":"6a2a99737d55f901e2b4b2dc","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_prigramming-languages-related","sort":1780986730566000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"编程语言相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd37","doc\_release\_id":"6a2a99737d55f901e2b4b2dd","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-mcp-server-related-issues","sort":1780986730567000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd51","doc\_release\_id":"6a2a99737d55f901e2b4b2e4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-remote-ssh-related-issues","sort":1780986730574000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Remote SSH 相关问题"},{"\_id":"6a27b7bf4bdbc784e337fd7b","doc\_release\_id":"6a2a99737d55f901e2b4b2ee","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc54","path":"ide\_troubleshoot-performance-issues","sort":1780986730586000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"性能问题"},{"\_id":"6a27b7bf4bdbc784e337fcf4","doc\_release\_id":"6a340e5b620bf701bbe02508","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_open-source-software-notice","sort":1780986730549000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"开源软件声明"},{"\_id":"6a27b7bf4bdbc784e337fcf7","doc\_release\_id":"6a2a99737d55f901e2b4b2ce","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc61","path":"ide\_intro-to-llm","sort":1780986730550000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"豆包大模型备案公示"},{"\_id":"6a27b7bf4bdbc784e337fd57","doc\_release\_id":"6a2a99737d55f901e2b4b2e5","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_model-context-protocol","sort":1780986730575000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP 概览"},{"\_id":"6a27b7bf4bdbc784e337fd5a","doc\_release\_id":"6a2a99737d55f901e2b4b2e6","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_add-mcp-servers","sort":1780986730576000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"添加 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd5e","doc\_release\_id":"6a2aa13b7d55f901e2b4b8f4","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_mcp-server-install-links","sort":1780986730578000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"MCP Server 安装链接"},{"\_id":"6a27b7bf4bdbc784e337fd63","doc\_release\_id":"6a2a99737d55f901e2b4b2e8","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_use-mcp-servers-in-agents","sort":1780986730579000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"在智能体中使用 MCP Server"},{"\_id":"6a27b7bf4bdbc784e337fd66","doc\_release\_id":"6a2a99737d55f901e2b4b2e9","hidden":false,"parent\_id":"6a27b7bf4bdbc784e337fc8c","path":"ide\_check-mcp-server-logs","sort":1780986730580000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"查看 MCP Server 的日志"},{"\_id":"6a2bed994bdbc784e3b39784","doc\_release\_id":"6a2bed9904efdb01aa0bf262","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_automate-actions-with-hooks","sort":1780986730598000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"通过 Hook 实现自动化"},{"\_id":"6a2bed9d4bdbc784e3b39872","doc\_release\_id":"6a3e2cb5d6149c01ba317774","hidden":false,"parent\_id":"6a2bed994bdbc784e3b39779","path":"ide\_hook-configuration-reference","sort":1781165376289000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"Hook 配置详解"},{"\_id":"6a66d8494bdbc784e314a6b6","doc\_release\_id":"6a6709d9baafae01bdda06f2","hidden":false,"parent\_id":"6a66d8394bdbc784e314a365","path":"ide\_coming-soon","sort":1785124921280900,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"即将上线：以积分为基础的计费模式"},{"\_id":"6a69ca9b4bdbc784e3dde75b","doc\_release\_id":"6a69df1db0d56301bade22ae","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_permission-and-approval","sort":1785135581001000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"权限与审批概览"},{"\_id":"6a69caa44bdbc784e3ddea56","doc\_release\_id":"6a69cdfab0d56301bade185a","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-permission-mode-configuration-reference","sort":1785135581001100,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义权限模式配置参考"},{"\_id":"6a69cab04bdbc784e3ddeee2","doc\_release\_id":"6a69cab01eefd201b2b9fcb7","hidden":false,"parent\_id":"6a6701dd4bdbc784e31fe0f1","path":"ide\_custom-global-permission-configuration-reference","sort":1785157495167000,"tab\_id":"67a5b43a9ae5aa03545c7a07","title":"自定义全局权限配置参考"}],"site":{"\_id":"6a27b21694049701b9d125e0","name":"TRAE","icon":"https:\u002F\u002Fp9-arcosite.byteimg.com\u002Ftos-cn-i-goo7wpa0wc\u002Ff5cd1485db3b4f328599afe28a1b54d9~tplv-goo7wpa0wc-topic.png","logo\_link":"https:\u002F\u002Fwww.trae.cn\u002F","custom\_domain":{"domains":["docs.trae.cn"],"domain\_path":"\u002F"},"seo":{"googleMetaKey":"Djn\_d63iCka07pN3cVhp3GJBTa8yKbmOkvLf45CuD6k","bingMetaKey":"","baiduMetaKey":"codeva-6r8UBfgVA4"},"rag":{"enable":true,"knowledge":{"scope":"all"},"rules":{"model":4,"prompt":"# 角色\n你是 TRAE 文档问答助手，仅基于检索到的官方文档片段回答用户问题。\n\n# 核心准则\n1. 严格依据文档作答。文档未涵盖的内容直接说\"未在文档中找到相关说明\"，不要补充、不要推测。\n2. 文档片段相互矛盾时，优先采用更新时间较近的版本，并提示用户\"文档中存在不同表述，建议核对最新版本\"。\n\n# 边界\n- 用户追问与文档无关的内容时，礼貌引导回到文档主题。\n- 不臆测产品路线图、未发布功能、价格政策细节。\n- 不与用户争辩；用户质疑回答时，重新检索并诚实说明依据。","count":10,"questions":["TRAE IDE 里最热门的 Skill 是哪些？","如何创建自定义智能体？","如何配置 Rules？"],"welcome":{"title":"TRAE 智能问答助手","content":"你好，我是 TRAE 文档问答助手 🎉\n你在阅读当前文档的过程中，无论对文档概念的解释，还是文档内容方面的疑问，都可以随时向我提问，我会全力为你解答"},"fallback":"抱歉，未在文档中找到相关说明"}},"feedback":{"enable":true}}}}},"errors":null}
