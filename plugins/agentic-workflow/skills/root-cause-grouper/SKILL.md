---
name: root-cause-grouper
metadata:
  version: 0.1.0
description: 把多个相关 issue 归并到同一根因组。当 Reviewer 输出多个 issue 需要按根因分组修复时使用。适用于 coding 域的 issue 归并和 ralph 域的失败模式识别。
---

# Root Cause Grouper

## 触发场景

- Reviewer agent 输出 verdict 后，需要把 issues 按根因归并时
- Orchestrator 准备下一轮委派时，需要确定修复分组
- 多个 issue 存在关联（同一调用链/同一函数/同一类缺陷）时

## 归并规则

### 输入

```text
=== Issues 列表 ===
[
  { "id": "issue-1", "file": "src/a.ts", "line": 42, "message": "..." },
  { "id": "issue-2", "file": "src/b.ts", "line": 10, "message": "..." },
  { "id": "issue-3", "file": "src/a.ts", "line": 50, "message": "..." }
]

=== 已知上下文 ===
调用链、模块依赖、错误类型
```

### 归并流程

1. **提取特征**：每个 issue 的 file、line、错误类型、调用链
2. **计算关联**：
   - 同一文件 + 同一函数 → 同根因
   - 同一调用链上下游 → 同根因
   - 同一错误类型 + 相邻行 → 同根因
3. **分组输出**：每组分配唯一 `root_cause_group` id

### 输出格式

```json
{
  "groups": [
    {
      "root_cause_group": "rcg-1",
      "issue_ids": ["issue-1", "issue-3"],
      "root_cause": "<根因描述>",
      "fix_strategy": "<建议修复策略>"
    },
    {
      "root_cause_group": "rcg-2",
      "issue_ids": ["issue-2"],
      "root_cause": "<根因描述>",
      "fix_strategy": "<建议修复策略>"
    }
  ]
}
```

## 归并优先级

| 优先级 | 判定条件 | 示例 |
|--------|---------|------|
| 1 | 同一函数内的多个 issue | 同一函数三个变量未校验 |
| 2 | 同一调用链上下游 | 上游返回值未处理导致下游崩溃 |
| 3 | 同一错误模式 | 三处同一 API 调用都缺错误处理 |
| 4 | 同一文件不同函数 | 同文件两个独立函数各有 issue |

## 禁止事项

- 不要把同一调用链上的三个症状写成三个独立 issue
- 不要为了"干净"把不相关的 issue 强行归并
- 跨根因的 issue 各自独立 id

## 红线

- 归并后每组 = 一次最小修复 = 一个 commit/changeset 单元
- 一次委派只解决一个根因组
- 禁止逐条 issue 打补丁
