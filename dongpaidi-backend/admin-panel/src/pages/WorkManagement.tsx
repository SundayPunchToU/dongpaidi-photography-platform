import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Image,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  HeartOutlined,
  MessageOutlined,
  EyeInvisibleOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workApi } from '@/services/api'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface Work {
  id: string
  title: string
  description?: string
  category: string
  location?: string
  tags: string[]
  images: string[]
  coverImage?: string
  status: string
  isPremium: boolean
  price?: number
  author: {
    id: string
    nickname: string
    avatarUrl?: string
    isVerified: boolean
  }
  stats: {
    likeCount: number
    commentCount: number
    viewCount: number
    collectCount: number
  }
  createdAt: string
  updatedAt: string
}

const WorkManagement: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const queryClient = useQueryClient()

  // 获取作品列表
  const { data: worksData, isLoading } = useQuery({
    queryKey: ['works', currentPage, pageSize, searchKeyword, selectedCategory, selectedStatus],
    queryFn: () => workApi.getWorks({
      page: currentPage,
      limit: pageSize,
      keyword: searchKeyword || undefined,
      category: selectedCategory || undefined,
      status: selectedStatus || undefined,
    }),
  })

  // 获取作品统计
  const { data: statsData } = useQuery({
    queryKey: ['work-stats'],
    queryFn: () => workApi.getWorkStats(),
  })

  // 更新作品状态
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      workApi.updateWorkStatus(id, { status, reason }),
    onSuccess: () => {
      message.success('作品状态更新成功')
      queryClient.invalidateQueries({ queryKey: ['works'] })
      queryClient.invalidateQueries({ queryKey: ['work-stats'] })
    },
    onError: () => {
      message.error('作品状态更新失败')
    },
  })

  // 删除作品
  const deleteWorkMutation = useMutation({
    mutationFn: (id: string) => workApi.deleteWork(id),
    onSuccess: () => {
      message.success('作品删除成功')
      queryClient.invalidateQueries({ queryKey: ['works'] })
      queryClient.invalidateQueries({ queryKey: ['work-stats'] })
    },
    onError: () => {
      message.error('作品删除失败')
    },
  })

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
  }

  // 处理筛选
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  // 查看作品详情
  const handleViewDetail = (work: Work) => {
    setSelectedWork(work)
    setDetailModalVisible(true)
  }

  // 更新作品状态
  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status })
  }

  // 删除作品
  const handleDeleteWork = (id: string) => {
    deleteWorkMutation.mutate(id)
  }

  // 分类映射
  const categoryMap: Record<string, string> = {
    portrait: '人像',
    landscape: '风景',
    street: '街拍',
    commercial: '商业',
    art: '艺术',
    wedding: '婚礼',
    fashion: '时尚',
    nature: '自然',
    architecture: '建筑',
    food: '美食',
  }

  // 状态映射
  const statusMap: Record<string, { text: string; color: string }> = {
    published: { text: '已发布', color: 'green' },
    draft: { text: '草稿', color: 'orange' },
    deleted: { text: '已删除', color: 'red' },
  }

  const columns = [
    {
      title: '作品',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 80,
      render: (coverImage: string, record: Work) => (
        <Image
          width={60}
          height={60}
          src={coverImage || record.images[0]}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: Work) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {title}
            {record.isPremium && (
              <Tag color="gold" style={{ marginLeft: 8 }}>
                付费
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {categoryMap[record.category] || record.category}
          </div>
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: Work['author']) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            size={32}
            src={author.avatarUrl}
            icon={<UserOutlined />}
            style={{ marginRight: 8 }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {author.nickname}
              {author.isVerified && (
                <CheckCircleOutlined style={{ color: '#1890ff', marginLeft: 4 }} />
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (record: Work) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 2 }}>
            <HeartOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
            {record.stats.likeCount}
            <MessageOutlined style={{ color: '#1890ff', marginLeft: 8, marginRight: 4 }} />
            {record.stats.commentCount}
          </div>
          <div>
            <EyeOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            {record.stats.viewCount}
            <StarOutlined style={{ color: '#faad14', marginLeft: 8, marginRight: 4 }} />
            {record.stats.collectCount}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Work) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="发布">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleUpdateStatus(record.id, 'published')}
              />
            </Tooltip>
          )}
          {record.status === 'published' && (
            <Tooltip title="下架">
              <Button
                type="text"
                icon={<EyeInvisibleOutlined />}
                style={{ color: '#faad14' }}
                onClick={() => handleUpdateStatus(record.id, 'draft')}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这个作品吗？"
            onConfirm={() => handleDeleteWork(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          作品管理
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理用户上传的作品，包括审核、分类、推荐等功能
        </p>
      </div>

      <div className="page-content">
        {/* 统计卡片 */}
        {statsData?.data && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总作品数"
                  value={statsData.data.data.total}
                  prefix={<EyeOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已发布"
                  value={statsData.data.data.published}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待审核"
                  value={statsData.data.data.pending}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日新增"
                  value={statsData.data.data.newToday}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 搜索和筛选 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索作品标题或描述"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: '100%' }}
                onChange={handleCategoryChange}
              >
                {Object.entries(categoryMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusChange}
              >
                {Object.entries(statusMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.text}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* 作品列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={worksData?.data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: worksData?.data?.pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, size) => {
                setCurrentPage(page)
                setPageSize(size || 20)
              },
            }}
          />
        </Card>

        {/* 作品详情弹窗 */}
        <Modal
          title="作品详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedWork && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Image.PreviewGroup>
                    {selectedWork.images.map((image, index) => (
                      <Image
                        key={index}
                        width="100%"
                        src={image}
                        style={{ marginBottom: 8 }}
                      />
                    ))}
                  </Image.PreviewGroup>
                </Col>
                <Col span={12}>
                  <div style={{ padding: '0 16px' }}>
                    <Title level={4}>{selectedWork.title}</Title>
                    <p style={{ color: '#666', marginBottom: 16 }}>
                      {selectedWork.description}
                    </p>

                    <div style={{ marginBottom: 12 }}>
                      <strong>分类：</strong>
                      <Tag color="blue">
                        {categoryMap[selectedWork.category] || selectedWork.category}
                      </Tag>
                    </div>

                    {selectedWork.location && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>拍摄地点：</strong>
                        {selectedWork.location}
                      </div>
                    )}

                    <div style={{ marginBottom: 12 }}>
                      <strong>标签：</strong>
                      {selectedWork.tags.map((tag, index) => (
                        <Tag key={index} style={{ marginBottom: 4 }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <strong>状态：</strong>
                      <Tag color={statusMap[selectedWork.status]?.color}>
                        {statusMap[selectedWork.status]?.text}
                      </Tag>
                    </div>

                    {selectedWork.isPremium && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>价格：</strong>
                        ¥{selectedWork.price?.toFixed(2)}
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <strong>统计数据：</strong>
                      <div style={{ marginTop: 8 }}>
                        <Badge count={selectedWork.stats.likeCount} showZero>
                          <HeartOutlined style={{ fontSize: 16, marginRight: 16 }} />
                        </Badge>
                        <Badge count={selectedWork.stats.commentCount} showZero>
                          <MessageOutlined style={{ fontSize: 16, marginRight: 16 }} />
                        </Badge>
                        <Badge count={selectedWork.stats.viewCount} showZero>
                          <EyeOutlined style={{ fontSize: 16, marginRight: 16 }} />
                        </Badge>
                        <Badge count={selectedWork.stats.collectCount} showZero>
                          <StarOutlined style={{ fontSize: 16 }} />
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <strong>创建时间：</strong>
                      {new Date(selectedWork.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default WorkManagement
