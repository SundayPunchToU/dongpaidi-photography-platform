import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Modal,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userApi } from '@/services/api'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select

interface User {
  id: string
  nickname: string
  email?: string
  phone?: string
  platform: string
  isVerified: boolean
  status: string
  avatarUrl?: string
  specialties: string[]
  location?: string
  createdAt: string
  lastLoginAt?: string
}

const UserManagement: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const queryClient = useQueryClient()

  // 获取用户列表
  const { data: usersData, isLoading, error: usersError, refetch } = useQuery(
    ['users', currentPage, pageSize, searchKeyword, platformFilter, verifiedFilter],
    () => userApi.getUsers({
      page: currentPage,
      limit: pageSize,
      keyword: searchKeyword,
      platform: platformFilter,
      isVerified: verifiedFilter,
    }),
    {
      keepPreviousData: true,
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('获取用户列表失败:', error);
        message.error('获取用户列表失败，请稍后重试');
      },
    }
  )

  // 获取用户统计
  const { data: userStats, error: statsError } = useQuery(
    'userStats',
    userApi.getUserStats,
    {
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('获取用户统计失败:', error);
      },
    }
  )

  // 更新用户状态
  const updateStatusMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => userApi.updateUserStatus(id, data),
    {
      onSuccess: () => {
        message.success('操作成功')
        queryClient.invalidateQueries('users')
        queryClient.invalidateQueries('userStats')
      },
      onError: () => {
        message.error('操作失败')
      },
    }
  )

  // 删除用户
  const deleteUserMutation = useMutation(
    (id: string) => userApi.deleteUser(id),
    {
      onSuccess: () => {
        message.success('删除成功')
        queryClient.invalidateQueries('users')
        queryClient.invalidateQueries('userStats')
      },
      onError: () => {
        message.error('删除失败')
      },
    }
  )

  const handleVerifyUser = (id: string, isVerified: boolean) => {
    updateStatusMutation.mutate({ id, data: { isVerified } })
  }

  const handleDeleteUser = (id: string) => {
    deleteUserMutation.mutate(id)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    refetch()
  }

  const handleReset = () => {
    setSearchKeyword('')
    setPlatformFilter('')
    setVerifiedFilter(undefined)
    setCurrentPage(1)
    refetch()
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.email || record.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 80,
      render: (platform) => {
        const platformMap: Record<string, { color: string; text: string }> = {
          wechat: { color: 'green', text: '微信' },
          admin: { color: 'blue', text: '管理' },
        }
        const config = platformMap[platform] || { color: 'default', text: platform }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '认证状态',
      dataIndex: 'isVerified',
      width: 100,
      render: (isVerified) => (
        <Tag color={isVerified ? 'success' : 'warning'}>
          {isVerified ? '已认证' : '未认证'}
        </Tag>
      ),
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      width: 150,
      render: (specialties: string[]) => (
        <div>
          {specialties?.slice(0, 2).map((specialty, index) => (
            <Tag key={index} size="small">{specialty}</Tag>
          ))}
          {specialties?.length > 2 && <span style={{ color: '#666' }}>...</span>}
        </div>
      ),
    },
    {
      title: '地区',
      dataIndex: 'location',
      width: 120,
      ellipsis: true,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={record.isVerified ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => handleVerifyUser(record.id, !record.isVerified)}
            loading={updateStatusMutation.isLoading}
          >
            {record.isVerified ? '取消认证' : '认证'}
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteUserMutation.isLoading}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = userStats?.data || { total: 0, verified: 0, active: 0, newToday: 0 }

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          用户管理
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理系统用户，包括认证、状态管理等功能
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总用户数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已认证用户" value={stats.verified} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="活跃用户" value={stats.active} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日新增" value={stats.newToday} />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 搜索和筛选 */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <Input
              placeholder="搜索用户昵称、邮箱或手机号"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="选择平台"
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="wechat">微信</Option>
              <Option value="admin">管理</Option>
            </Select>
            <Select
              placeholder="认证状态"
              value={verifiedFilter}
              onChange={setVerifiedFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value={true}>已认证</Option>
              <Option value={false}>未认证</Option>
            </Select>
          </div>
          <div className="toolbar-right">
            <Button onClick={handleSearch} type="primary" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </div>
        </div>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={usersData?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: usersData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 20)
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}

export default UserManagement
