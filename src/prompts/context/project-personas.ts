/**
 * 虚拟项目背景生成器
 * 为对话提供逼真的项目上下文
 */

export interface ProjectPersona {
    name: string;
    description: string;
    techStack: string[];
    team: string;
    stage: string;
}

export const PROJECT_PERSONAS: ProjectPersona[] = [
    {
        name: 'ShopEase 电商平台',
        description: '一个 B2C 电商平台，日活 50 万用户，正在做性能优化和国际化',
        techStack: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Elasticsearch'],
        team: '前端 5 人 + 后端 4 人 + DevOps 2 人',
        stage: '已上线运营 2 年，正在做 v3.0 重构',
    },
    {
        name: 'TaskFlow 项目管理 SaaS',
        description: '类似 Jira 的项目管理工具，面向中小团队，采用 B2B 订阅制',
        techStack: ['Vue 3', 'Vite', 'Express', 'MongoDB', 'WebSocket'],
        team: '全栈团队 6 人',
        stage: '产品 MVP 阶段，快速迭代中',
    },
    {
        name: 'MediCore 医疗数据平台',
        description: '医院内部的患者数据管理和分析平台，对安全性和合规性要求极高',
        techStack: ['React', 'TypeScript', 'Java Spring Boot', 'PostgreSQL', 'Kafka'],
        team: '前端 3 人 + 后端 5 人 + QA 2 人',
        stage: '已上线 1 年，正在做 HIPAA 合规改造',
    },
    {
        name: 'SocialHub 社交应用',
        description: '基于兴趣的社交平台，核心功能是动态 Feed、即时通讯和直播',
        techStack: ['React Native', 'Node.js', 'PostgreSQL', 'Redis', 'WebSocket', 'FFmpeg'],
        team: '移动端 4 人 + 后端 6 人 + 基础设施 3 人',
        stage: '用户量 200 万，正在做性能优化和降本',
    },
    {
        name: 'DataViz 数据可视化平台',
        description: '企业级 BI 工具，支持自定义 Dashboard、SQL 查询和报表导出',
        techStack: ['React', 'D3.js', 'ECharts', 'Python', 'ClickHouse', 'Docker'],
        team: '前端 4 人 + 数据工程 3 人',
        stage: '第二版开发中，重点提升大屏渲染性能',
    },
];

/**
 * 随机选择一个项目背景
 */
export function getRandomPersona(): ProjectPersona {
    return PROJECT_PERSONAS[Math.floor(Math.random() * PROJECT_PERSONAS.length)]!;
}

/**
 * 生成项目背景描述文本
 */
export function formatPersonaContext(persona: ProjectPersona): string {
    return [
        `项目：${persona.name}`,
        `描述：${persona.description}`,
        `技术栈：${persona.techStack.join(', ')}`,
        `团队：${persona.team}`,
        `阶段：${persona.stage}`,
    ].join('\n');
}
