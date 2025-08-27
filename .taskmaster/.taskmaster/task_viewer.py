#!/usr/bin/env python3
"""
TaskMaster任务查看器
用于查看和管理TaskMaster创建的任务
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any

class TaskMasterViewer:
    def __init__(self, config_path: str = ".taskmaster"):
        self.config_path = config_path
        self.config = self._load_config()
        self.tasks = self._load_tasks()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载TaskMaster配置"""
        try:
            with open(f"{self.config_path}/config.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print("❌ 配置文件未找到")
            return {}
    
    def _load_tasks(self) -> List[Dict[str, Any]]:
        """加载所有任务"""
        tasks = []
        
        # 加载示例任务（实际场景中这里会连接数据库或任务存储）
        example_file = f"{self.config_path}/generated_tasks_example.json"
        if os.path.exists(example_file):
            with open(example_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                tasks.extend(data.get("auto_generated_tasks", []))
        
        return tasks
    
    def list_tasks(self, status_filter: str = None, priority_filter: str = None):
        """获取任务列表"""
        print("\n🎯 TaskMaster 任务列表")
        print("=" * 80)
        
        if not self.tasks:
            print("📝 暂无任务")
            return
        
        # 过滤任务
        filtered_tasks = self.tasks
        if status_filter:
            # 模拟状态过滤（实际情况下会从数据库获取状态）
            print(f"🔍 过滤状态: {status_filter}")
        if priority_filter:
            filtered_tasks = [t for t in filtered_tasks if t.get('priority') == priority_filter]
            print(f"🔍 过滤优先级: {priority_filter}")
        
        # 显示任务
        for i, task in enumerate(filtered_tasks, 1):
            self._print_task_summary(i, task)
    
    def _print_task_summary(self, index: int, task: Dict[str, Any]):
        """打印任务摘要"""
        task_id = task.get('id', 'N/A')
        name = task.get('name', 'N/A')
        priority = task.get('priority', 'N/A')
        hours = task.get('estimated_hours', 0)
        assignee = task.get('assignee', 'N/A')
        complexity = task.get('complexity_score', 0)
        
        # 优先级图标
        priority_icons = {
            'critical': '🔴',
            'high': '🟠', 
            'medium': '🟡',
            'low': '🟢'
        }
        priority_icon = priority_icons.get(priority, '⚪')
        
        print(f"\n{index:2d}. {priority_icon} [{task_id}] {name}")
        print(f"    ⏱️  工时: {hours}h  👤 负责人: {assignee}  📊 复杂度: {complexity:.1f}")
        
        # 显示子任务数量
        subtasks = task.get('auto_split_subtasks', [])
        if subtasks:
            print(f"    🔗 子任务: {len(subtasks)}个")
        
        # 显示依赖
        deps = task.get('intelligent_dependencies', [])
        if deps:
            print(f"    🔄 依赖: {', '.join(deps)}")
    
    def show_task_detail(self, task_id: str):
        """显示任务详细信息"""
        task = None
        for t in self.tasks:
            if t.get('id') == task_id:
                task = t
                break
        
        if not task:
            print(f"❌ 未找到任务 {task_id}")
            return
        
        print(f"\n📋 任务详情: {task_id}")
        print("=" * 80)
        
        # 基本信息
        print(f"📝 名称: {task.get('name', 'N/A')}")
        print(f"📄 描述: {task.get('description', 'N/A')}")
        print(f"🏷️  类别: {task.get('category', 'N/A')}")
        print(f"⚡ 优先级: {task.get('priority', 'N/A')}")
        print(f"⏱️  工时: {task.get('estimated_hours', 0)}小时")
        print(f"👤 负责人: {task.get('assignee', 'N/A')}")
        print(f"📊 复杂度: {task.get('complexity_score', 0):.1f}")
        
        # 自动生成原因
        reason = task.get('auto_generated_reason')
        if reason:
            print(f"🤖 生成原因: {reason}")
        
        # 子任务
        subtasks = task.get('auto_split_subtasks', [])
        if subtasks:
            print(f"\n🔗 子任务 ({len(subtasks)}个):")
            for i, subtask in enumerate(subtasks, 1):
                st_name = subtask.get('name', 'N/A')
                st_hours = subtask.get('hours', 0)
                print(f"   {i}. {st_name} ({st_hours}h)")
        
        # 依赖关系
        deps = task.get('intelligent_dependencies', [])
        if deps:
            print(f"\n🔄 依赖任务: {', '.join(deps)}")
        
        # 风险
        risks = task.get('auto_detected_risks', [])
        if risks:
            print(f"\n⚠️  识别的风险:")
            for risk in risks:
                risk_type = risk.get('type', 'N/A')
                desc = risk.get('description', 'N/A')
                prob = risk.get('probability', 0)
                print(f"   • {risk_type}: {desc} (概率: {prob:.1f})")
        
        # 质量门禁
        gates = task.get('quality_gates', [])
        if gates:
            print(f"\n✅ 质量门禁:")
            for gate in gates:
                print(f"   • {gate}")
    
    def show_statistics(self):
        """显示任务统计信息"""
        print("\n📊 任务统计")
        print("=" * 50)
        
        if not self.tasks:
            print("📝 暂无任务数据")
            return
        
        # 基本统计
        total_tasks = len(self.tasks)
        total_hours = sum(t.get('estimated_hours', 0) for t in self.tasks)
        avg_complexity = sum(t.get('complexity_score', 0) for t in self.tasks) / total_tasks
        
        print(f"📋 总任务数: {total_tasks}")
        print(f"⏱️  总工时: {total_hours}小时")
        print(f"📊 平均复杂度: {avg_complexity:.2f}")
        
        # 优先级分布
        priority_count = {}
        for task in self.tasks:
            priority = task.get('priority', 'unknown')
            priority_count[priority] = priority_count.get(priority, 0) + 1
        
        print(f"\n🎯 优先级分布:")
        for priority, count in priority_count.items():
            percentage = (count / total_tasks) * 100
            print(f"   {priority}: {count}个 ({percentage:.1f}%)")
        
        # 负责人分布
        assignee_hours = {}
        for task in self.tasks:
            assignee = task.get('assignee', 'unknown')
            hours = task.get('estimated_hours', 0)
            assignee_hours[assignee] = assignee_hours.get(assignee, 0) + hours
        
        print(f"\n👥 工时分布:")
        for assignee, hours in assignee_hours.items():
            percentage = (hours / total_hours) * 100
            print(f"   {assignee}: {hours}h ({percentage:.1f}%)")
    
    def show_timeline(self):
        """显示任务时间线（模拟）"""
        print("\n📅 任务时间线")
        print("=" * 50)
        
        # 模拟关键路径和并行任务
        print("🔗 关键路径:")
        print("   TM_AST_001 → TM_AST_002 → TM_AST_003 → TM_AST_005 → TM_AST_006")
        print("   (24h)      (32h)       (28h)       (20h)       (28h)")
        
        print("\n🔀 可并行执行:")
        print("   TM_AST_004 可与 TM_AST_003 并行 (节省24小时)")
        
        print("\n⏳ 预计完成时间:")
        print("   串行执行: 156小时 (约20个工作日)")
        print("   并行优化: 132小时 (约17个工作日)")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("📖 TaskMaster 任务查看器使用说明:")
        print("   python task_viewer.py list [--priority=high] [--status=active]")
        print("   python task_viewer.py show <task_id>")
        print("   python task_viewer.py stats")
        print("   python task_viewer.py timeline")
        return
    
    viewer = TaskMasterViewer()
    command = sys.argv[1]
    
    if command == "list":
        # 解析过滤参数
        priority_filter = None
        status_filter = None
        
        for arg in sys.argv[2:]:
            if arg.startswith("--priority="):
                priority_filter = arg.split("=")[1]
            elif arg.startswith("--status="):
                status_filter = arg.split("=")[1]
        
        viewer.list_tasks(status_filter, priority_filter)
    
    elif command == "show":
        if len(sys.argv) < 3:
            print("❌ 请指定任务ID")
            return
        task_id = sys.argv[2]
        viewer.show_task_detail(task_id)
    
    elif command == "stats":
        viewer.show_statistics()
    
    elif command == "timeline":
        viewer.show_timeline()
    
    else:
        print(f"❌ 未知命令: {command}")

if __name__ == "__main__":
    main()