import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  CameraOutlined,
} from '@ant-design/icons'
import { useQuery } from 'react-query'
import { appointmentApi } from '@/services/api'

const { Title } = Typography
const { Option } = Select

const AppointmentManagement: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 获取约拍列表
  const { data: appointmentsData, isLoading, refetch } = useQuery(
    ['appointments', currentPage, pageSize, searchKeyword, statusFilter],
    () => appointmentApi.getAppointments({
      page: currentPage,
      limit: pageSize,
      keyword: searchKeyword,
      status: statusFilter,
    }),
    {
      keepPreviousData: true,
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('获取约拍列表失败:', error);
        message.error('获取约拍列表失败，请稍后重试');
      },
    }
  )

  // 获取约拍统计
  const { data: appointmentStats } = useQuery(
    'appointmentStats', 
    appointmentApi.getAppointmentStats,
    {
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('获取约拍统计失败:', error);
      },
    }
  )

  const handleSearch = () => {
    setCurrentPage(1)
    refetch()
  }

  const handleReset = () => {
    setSearchKeyword('')
    setStatusFilter('')
    setCurrentPage(1)
    refetch()
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      open: 'blue',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red',
    }
    return statusColors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      open: '开放中',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return statusTexts[status] || status
  }

  const getTypeText = (type: string) => {
    const typeTexts: Record<string, string> = {
      photographer_seek_model: '摄影师寻找模特',
      model_seek_photographer: '模特寻找摄影师',
    }
    return typeTexts[type] || type
  }

  const getTypeIcon = (type: string) => {
    return type === 'photographer_seek_model' ? <CameraOutlined /> : <UserOutlined />
  }

  const columns = [
    {
      title: '约拍信息',
      key: 'info',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {getTypeIcon(record.type)} {record.title}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            发布者: {record.publisher?.nickname || '未知'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.location && `地点: ${record.location}`}
          </div>
        </div>
      ),
      width: 300,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'photographer_seek_model' ? 'blue' : 'green'}>
          {getTypeText(type)}
        </Tag>
      ),
      width: 150,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget: number) => budget ? `¥${budget}` : '-',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info('查看详情功能开发中')}
          >
            详情
          </Button>
        </Space>
      ),
      width: 80,
    },
  ]

  const stats = appointmentStats?.data || { 
    total: 0, 
    open: 0, 
    inProgress: 0, 
    completed: 0,
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          约拍管理
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理约拍信息，包括状态跟踪、纠纷处理等功能
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总约拍数"
              value={stats.total}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="开放中"
              value={stats.open}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 搜索和筛选 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="搜索约拍标题或描述"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择状态"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="open">开放中</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Col>
            <Col span={10}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 约拍表格 */}
        <Table
          columns={columns}
          dataSource={appointmentsData?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: appointmentsData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 20)
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default AppointmentManagement
