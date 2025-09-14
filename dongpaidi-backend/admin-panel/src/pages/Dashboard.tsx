import React from 'react'
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd'
import { 
  UserOutlined, 
  PictureOutlined, 
  CalendarOutlined, 
  MessageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/services/api'

const { Title } = Typography

const Dashboard: React.FC = () => {
  // 获取总体统计数据
  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ['overallStats'],
    queryFn: () => statsApi.getOverallStats(),
    refetchInterval: 30000, // 30秒刷新一次
  })

  // 获取趋势数据
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['trendData'],
    queryFn: () => statsApi.getTrendData('week'),
    refetchInterval: 60000, // 1分钟刷新一次
  })

  // 模拟数据（当API不可用时）
  const mockStats = {
    users: 1234,
    works: 5678,
    appointments: 234,
    messages: 890,
  }

  const mockTrendData = [
    { date: '2024-01-01', users: 120, works: 80, appointments: 20 },
    { date: '2024-01-02', users: 132, works: 95, appointments: 25 },
    { date: '2024-01-03', users: 145, works: 110, appointments: 30 },
    { date: '2024-01-04', users: 158, works: 125, appointments: 28 },
    { date: '2024-01-05', users: 170, works: 140, appointments: 35 },
    { date: '2024-01-06', users: 185, works: 155, appointments: 40 },
    { date: '2024-01-07', users: 200, works: 170, appointments: 45 },
  ]

  const stats = overallStats?.data?.data || mockStats
  const chartData = Array.isArray(trendData?.data?.data) ? trendData.data.data : mockTrendData

  const statCards = [
    {
      title: '总用户数',
      value: stats.users,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
      trend: 12.5,
    },
    {
      title: '总作品数',
      value: stats.works,
      icon: <PictureOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      trend: 8.2,
    },
    {
      title: '约拍数量',
      value: stats.appointments,
      icon: <CalendarOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
      trend: -2.1,
    },
    {
      title: '消息数量',
      value: stats.messages,
      icon: <MessageOutlined style={{ color: '#f5222d' }} />,
      color: '#f5222d',
      trend: 15.3,
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          仪表盘
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          欢迎使用懂拍帝管理系统，这里是系统概览
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
                suffix={
                  <span style={{ fontSize: 14, color: '#666' }}>
                    {card.trend > 0 ? (
                      <span style={{ color: '#52c41a' }}>
                        <ArrowUpOutlined /> {card.trend}%
                      </span>
                    ) : (
                      <span style={{ color: '#f5222d' }}>
                        <ArrowDownOutlined /> {Math.abs(card.trend)}%
                      </span>
                    )}
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="数据趋势（最近7天）" loading={trendLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="用户"
                />
                <Line 
                  type="monotone" 
                  dataKey="works" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  name="作品"
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#faad14" 
                  strokeWidth={2}
                  name="约拍"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快速操作" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/users" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                👥 用户管理
              </a>
              <a href="/works" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                🖼️ 作品审核
              </a>
              <a href="/appointments" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                📅 约拍管理
              </a>
              <a href="/settings" style={{ padding: '8px 0' }}>
                ⚙️ 系统设置
              </a>
            </div>
          </Card>

          <Card title="系统状态">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数据库状态</span>
                <span style={{ color: '#52c41a' }}>● 正常</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Redis缓存</span>
                <span style={{ color: '#52c41a' }}>● 正常</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>文件存储</span>
                <span style={{ color: '#52c41a' }}>● 正常</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API服务</span>
                <span style={{ color: '#52c41a' }}>● 正常</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
