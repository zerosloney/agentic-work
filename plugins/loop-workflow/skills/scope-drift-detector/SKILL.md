---
name: scope-drift-detector
metadata:
  version: 0.1.0
description: 检测代码变更是否越界（scope drift）。当需要审查 diff 是否超出声明边界时使用。适用于 coding 和 ralph 域的每次执行者产出审查。
---

# Scope Drift Detector

## 触发场景

- Reviewer agent 审查执行者产出的 diff 时
- Orchestrator 判定本轮 action 前自验时
- 任何需要验证"改动是否落在声明边界内"的时刻

## 检测规则

### 输入

审查时需要以下上下文：

```text
=== 本轮 diff ===
diff --git 格式或文件路径列表

=== 声明边界 ===
hard_scope:        # 必须改的文件/目录
soft_scope:        # 可以改的文件/目录
forbidden_scope:   # 禁止触碰的文件/目录
```

### 检测流程

1. **提取变更路径**：从 diff 中提取所有被修改/新增/删除的文件路径
2. **分类判定**：
   - 所有路径 ∈ hard_scope ∪ soft_scope → `scope_drift: "PASS"`
   - 任一路径 ∉ hard_scope ∪ soft_scope 但也不在 forbidden_scope → `scope_drift: "WARN"`
   - 任一路径 ∈ forbidden_scope → `scope_drift: "FAIL"`
3. **输出结果**：返回判定标签 + 越界路径清单

### 输出格式

```json
{
  "scope_drift": "PASS | WARN | FAIL",
  "violations": [
    {
      "path": "<文件路径>",
      "violation_type": "outside_scope | forbidden_scope",
      "detail": "<说明>"
    }
  ]
}
```

## 判定标准

| 条件 | 判定 | 后续动作 |
|------|------|---------|
| 所有路径在 hard/soft_scope 内 | PASS | 继续审查 |
| 有路径在 soft_scope 外但不在 forbidden | WARN | 标记但可继续 |
| 任一路径在 forbidden_scope | FAIL | 立即停止，交回 Orchestrator |

## 红线

- 一行越界也是越界，不做"差不多就行"的放行
- 符号链接/软链按目标路径判定
- 构建产物（dist/target/node_modules）的变更不计入 drift
