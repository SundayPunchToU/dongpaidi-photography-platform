import React, { useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Upload,
  message,
  Tabs,
  Row,
  Col,
  Divider,
  Space,
  Tag,
  Modal,
  Table,
  Popconfirm,
} from 'antd'
import {
  UploadOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  BellOutlined,
  MailOutlined,
  WechatOutlined,
  AlipayOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

interface SystemConfig {
  siteName: string
  siteDescription: string
  siteLogo: string
  siteKeywords: string
  contactEmail: string
  contactPhone: string
  icp: string
  maxUploadSize: number
  allowedFileTypes: string[]
  enableRegistration: boolean
  enableEmailVerification: boolean
  enableSmsVerification: boolean
  defaultUserRole: string
  maxWorksPerUser: number
  enableWatermark: boolean
  watermarkText: string
  enablePayment: boolean
  wechatPayEnabled: boolean
  alipayEnabled: boolean
  commissionRate: number
}

interface PaymentConfig {
  id: string
  name: string
  type: 'wechat' | 'alipay'
  appId: string
  merchantId: string
  enabled: boolean
  testMode: boolean
}

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentConfig | null>(null)

  // 模拟系统配置数据
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    siteName: '懂拍帝',
    siteDescription: '专业的摄影师与模特约拍平台',
    siteLogo: '',
    siteKeywords: '摄影,约拍,模特,摄影师,作品分享',
    contactEmail: 'admin@dongpaidi.com',
    contactPhone: '400-123-4567',
    icp: '京ICP备12345678号',
    maxUploadSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    enableRegistration: true,
    enableEmailVerification: true,
    enableSmsVerification: false,
    defaultUserRole: 'user',
    maxWorksPerUser: 100,
    enableWatermark: true,
    watermarkText: '懂拍帝',
    enablePayment: true,
    wechatPayEnabled: true,
    alipayEnabled: true,
    commissionRate: 5,
  })

  // 模拟支付配置数据
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([
    {
      id: '1',
      name: '微信支付',
      type: 'wechat',
      appId: 'wx1234567890abcdef',
      merchantId: '1234567890',
      enabled: true,
      testMode: false,
    },
    {
      id: '2',
      name: '支付宝',
      type: 'alipay',
      appId: '2021001234567890',
      merchantId: '2088123456789012',
      enabled: true,
      testMode: false,
    },
  ])

  // 保存基础设置
  const handleSaveBasicSettings = async (values: any) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSystemConfig({ ...systemConfig, ...values })
      message.success('基础设置保存成功')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 保存上传设置
  const handleSaveUploadSettings = async (values: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSystemConfig({ ...systemConfig, ...values })
      message.success('上传设置保存成功')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 保存用户设置
  const handleSaveUserSettings = async (values: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSystemConfig({ ...systemConfig, ...values })
      message.success('用户设置保存成功')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 保存支付设置
  const handleSavePaymentSettings = async (values: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSystemConfig({ ...systemConfig, ...values })
      message.success('支付设置保存成功')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 添加/编辑支付配置
  const handleSavePaymentConfig = (values: any) => {
    if (editingPayment) {
      setPaymentConfigs(configs =>
        configs.map(config =>
          config.id === editingPayment.id ? { ...config, ...values } : config
        )
      )
      message.success('支付配置更新成功')
    } else {
      const newConfig: PaymentConfig = {
        id: Date.now().toString(),
        ...values,
      }
      setPaymentConfigs(configs => [...configs, newConfig])
      message.success('支付配置添加成功')
    }
    setPaymentModalVisible(false)
    setEditingPayment(null)
  }

  // 删除支付配置
  const handleDeletePaymentConfig = (id: string) => {
    setPaymentConfigs(configs => configs.filter(config => config.id !== id))
    message.success('支付配置删除成功')
  }

  // 支付配置表格列
  const paymentColumns = [
    {
      title: '支付方式',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PaymentConfig) => (
        <Space>
          {record.type === 'wechat' ? (
            <WechatOutlined style={{ color: '#07c160' }} />
          ) : (
            <AlipayOutlined style={{ color: '#1677ff' }} />
          )}
          {name}
        </Space>
      ),
    },
    {
      title: 'App ID',
      dataIndex: 'appId',
      key: 'appId',
    },
    {
      title: '商户号',
      dataIndex: 'merchantId',
      key: 'merchantId',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '模式',
      dataIndex: 'testMode',
      key: 'testMode',
      render: (testMode: boolean) => (
        <Tag color={testMode ? 'orange' : 'blue'}>
          {testMode ? '测试' : '生产'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: PaymentConfig) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingPayment(record)
              setPaymentModalVisible(true)
            }}
          />
          <Popconfirm
            title="确定要删除这个支付配置吗？"
            onConfirm={() => handleDeletePaymentConfig(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          系统设置
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          系统配置管理，包括参数设置、权限管理等功能
        </p>
      </div>

      <div className="page-content">
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 基础设置 */}
            <TabPane
              tab={
                <span>
                  <SettingOutlined />
                  基础设置
                </span>
              }
              key="basic"
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={systemConfig}
                onFinish={handleSaveBasicSettings}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="网站名称"
                      name="siteName"
                      rules={[{ required: true, message: '请输入网站名称' }]}
                    >
                      <Input placeholder="请输入网站名称" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="联系邮箱"
                      name="contactEmail"
                      rules={[
                        { required: true, message: '请输入联系邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input placeholder="请输入联系邮箱" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="网站描述"
                  name="siteDescription"
                  rules={[{ required: true, message: '请输入网站描述' }]}
                >
                  <TextArea rows={3} placeholder="请输入网站描述" />
                </Form.Item>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="关键词"
                      name="siteKeywords"
                      rules={[{ required: true, message: '请输入关键词' }]}
                    >
                      <Input placeholder="请输入关键词，用逗号分隔" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="联系电话"
                      name="contactPhone"
                    >
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="ICP备案号"
                      name="icp"
                    >
                      <Input placeholder="请输入ICP备案号" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="网站Logo"
                      name="siteLogo"
                    >
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                      >
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>上传Logo</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存基础设置
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            {/* 上传设置 */}
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  上传设置
                </span>
              }
              key="upload"
            >
              <Form
                layout="vertical"
                initialValues={systemConfig}
                onFinish={handleSaveUploadSettings}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="最大上传大小 (MB)"
                      name="maxUploadSize"
                      rules={[{ required: true, message: '请输入最大上传大小' }]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        style={{ width: '100%' }}
                        placeholder="请输入最大上传大小"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="允许的文件类型"
                      name="allowedFileTypes"
                    >
                      <Select
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="请选择允许的文件类型"
                        options={[
                          { label: 'JPG', value: 'jpg' },
                          { label: 'JPEG', value: 'jpeg' },
                          { label: 'PNG', value: 'png' },
                          { label: 'GIF', value: 'gif' },
                          { label: 'WebP', value: 'webp' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="启用水印"
                      name="enableWatermark"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="水印文字"
                      name="watermarkText"
                    >
                      <Input placeholder="请输入水印文字" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存上传设置
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            {/* 用户设置 */}
            <TabPane
              tab={
                <span>
                  <SecurityScanOutlined />
                  用户设置
                </span>
              }
              key="user"
            >
              <Form
                layout="vertical"
                initialValues={systemConfig}
                onFinish={handleSaveUserSettings}
              >
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      label="允许用户注册"
                      name="enableRegistration"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="启用邮箱验证"
                      name="enableEmailVerification"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="启用短信验证"
                      name="enableSmsVerification"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="默认用户角色"
                      name="defaultUserRole"
                      rules={[{ required: true, message: '请选择默认用户角色' }]}
                    >
                      <Select placeholder="请选择默认用户角色">
                        <Option value="user">普通用户</Option>
                        <Option value="photographer">摄影师</Option>
                        <Option value="model">模特</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="每用户最大作品数"
                      name="maxWorksPerUser"
                      rules={[{ required: true, message: '请输入每用户最大作品数' }]}
                    >
                      <InputNumber
                        min={1}
                        max={1000}
                        style={{ width: '100%' }}
                        placeholder="请输入每用户最大作品数"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存用户设置
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            {/* 支付设置 */}
            <TabPane
              tab={
                <span>
                  <AlipayOutlined />
                  支付设置
                </span>
              }
              key="payment"
            >
              <Form
                layout="vertical"
                initialValues={systemConfig}
                onFinish={handleSavePaymentSettings}
              >
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      label="启用支付功能"
                      name="enablePayment"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="启用微信支付"
                      name="wechatPayEnabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="启用支付宝"
                      name="alipayEnabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="平台佣金比例 (%)"
                      name="commissionRate"
                      rules={[{ required: true, message: '请输入平台佣金比例' }]}
                    >
                      <InputNumber
                        min={0}
                        max={50}
                        step={0.1}
                        style={{ width: '100%' }}
                        placeholder="请输入平台佣金比例"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存支付设置
                  </Button>
                </Form.Item>
              </Form>

              <Divider />

              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingPayment(null)
                    setPaymentModalVisible(true)
                  }}
                >
                  添加支付配置
                </Button>
              </div>

              <Table
                columns={paymentColumns}
                dataSource={paymentConfigs}
                rowKey="id"
                pagination={false}
              />
            </TabPane>

            {/* 通知设置 */}
            <TabPane
              tab={
                <span>
                  <BellOutlined />
                  通知设置
                </span>
              }
              key="notification"
            >
              <Form layout="vertical">
                <Title level={4}>邮件通知</Title>
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="新用户注册" name="emailNewUser" valuePropName="checked">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="新作品发布" name="emailNewWork" valuePropName="checked">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="新约拍申请" name="emailNewAppointment" valuePropName="checked">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Title level={4}>短信通知</Title>
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="验证码发送" name="smsVerification" valuePropName="checked">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="约拍提醒" name="smsAppointmentReminder" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="支付通知" name="smsPaymentNotification" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />}>
                    保存通知设置
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Card>

        {/* 支付配置弹窗 */}
        <Modal
          title={editingPayment ? '编辑支付配置' : '添加支付配置'}
          open={paymentModalVisible}
          onCancel={() => {
            setPaymentModalVisible(false)
            setEditingPayment(null)
          }}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={editingPayment || { enabled: true, testMode: false }}
            onFinish={handleSavePaymentConfig}
          >
            <Form.Item
              label="支付方式名称"
              name="name"
              rules={[{ required: true, message: '请输入支付方式名称' }]}
            >
              <Input placeholder="请输入支付方式名称" />
            </Form.Item>

            <Form.Item
              label="支付类型"
              name="type"
              rules={[{ required: true, message: '请选择支付类型' }]}
            >
              <Select placeholder="请选择支付类型">
                <Option value="wechat">微信支付</Option>
                <Option value="alipay">支付宝</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="App ID"
              name="appId"
              rules={[{ required: true, message: '请输入App ID' }]}
            >
              <Input placeholder="请输入App ID" />
            </Form.Item>

            <Form.Item
              label="商户号"
              name="merchantId"
              rules={[{ required: true, message: '请输入商户号' }]}
            >
              <Input placeholder="请输入商户号" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="启用状态"
                  name="enabled"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="测试模式"
                  name="testMode"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
                <Button
                  onClick={() => {
                    setPaymentModalVisible(false)
                    setEditingPayment(null)
                  }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default SystemSettings
