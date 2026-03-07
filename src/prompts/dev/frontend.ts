/**
 * 前端开发类 Prompt 模板
 * React/Vue 组件开发、状态管理、样式、性能优化
 */

export interface PromptTemplate {
    topic: string;
    prompts: string[];
}

export const FRONTEND_PROMPTS: PromptTemplate[] = [
    {
        topic: 'React 组件设计',
        prompts: [
            '帮我设计一个通用的 Table 组件，支持排序、筛选、分页、虚拟滚动和列自定义渲染，用 React + TypeScript',
            '我的 Form 表单组件需要支持动态字段（用户可以添加/删除表单项），怎么设计比较好？',
            '帮我实现一个 Drawer 抽屉组件，需要支持方向配置、动画过渡、锁定滚动和嵌套抽屉',
            '设计一个 React 文件上传组件，支持拖拽上传、多文件、进度显示、断点续传和预览',
            '帮我写一个 Select 多选组件，支持搜索、远程加载、标签显示和键盘操作',
        ],
    },
    {
        topic: 'React 状态管理',
        prompts: [
            '对比 Zustand、Jotai 和 Redux Toolkit，在中大型项目中该怎么选择？各有什么优劣？',
            '帮我设计购物车状态管理，需要支持乐观更新、离线缓存和多标签页同步',
            '我的 React 应用状态太分散了，如何做状态归一化设计？给出具体的重构方案',
            '如何实现一个 undo/redo 历史记录功能？需要支持批量操作和选择性撤销',
            '帮我写一个全局消息通知的状态管理方案，支持不同类型通知、自动消失、堆叠显示',
        ],
    },
    {
        topic: 'CSS 工程化',
        prompts: [
            '帮我设计一套 Design Token 系统，包括颜色、字体、间距、阴影，支持亮暗主题切换',
            '如何实现一个响应式的 Dashboard 布局？要求 PC 端三栏、平板双栏、手机单栏，用 CSS Grid',
            '帮我写一个纯 CSS 实现的骨架屏组件，需要支持不同形状和闪烁动画',
            '如何优化 CSS 性能？分析 CSS 选择器性能、重绘重排优化、CSS 动画与 JS 动画对比',
            '帮我实现一个 CSS Houdini 自定义属性动画的示例，做一个流体渐变背景效果',
        ],
    },
];
