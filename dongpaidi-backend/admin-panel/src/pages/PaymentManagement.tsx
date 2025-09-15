import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message,
  Descriptions,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 订单状态映射
const orderStatusMap = {
  pending: { text: '待支付', color: 'orange', icon: <ExclamationCircleOutlined /> },
  paid: { text: '已支付', color: 'green', icon: <CheckCircleOutlined /> },
  cancelled: { text: '已取消', color: 'red', icon: <CloseCircleOutlined /> },
  refunded: { text: '已退款', color: 'purple', icon: <UndoOutlined /> },
  expired: { text: '已过期', color: 'gray', icon: <CloseCircleOutlined /> },
};

// 支付方式映射
const paymentMethodMap = {
  wechat: { text: '微信支付', color: 'green' },
  alipay: { text: '支付宝', color: 'blue' },
};

// 支付状态映射
const paymentStatusMap = {
  pending: { text: '待支付', color: 'orange' },
  success: { text: '支付成功', color: 'green' },
  failed: { text: '支付失败', color: 'red' },
  cancelled: { text: '已取消', color: 'gray' },
  refunded: { text: '已退款', color: 'purple' },
};

interface OrderItem {
  id: string;
  orderId?: string;
  orderNo?: string;
  title?: string;
  description?: string;
  amount: number;
  status: string;
  method?: string;
  productType?: string;
  productId?: string;
  createdAt: string;
  expiresAt?: string;
  completedAt?: string | null;
  user: {
    id: string;
    nickname?: string;
    username?: string;
    avatarUrl?: string;
  };
  payments?: PaymentItem[];
}

interface PaymentItem {
  id: string;
  paymentNo: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentStats {
  totalOrders: number;
  paidOrders: number;
  totalAmount: number;
  todayOrders: number;
  pendingOrders: number;
  successRate: string;
}

const PaymentManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const queryClient = useQueryClient();

  // 获取支付统计
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const response = await paymentApi.getAdminStats();
      return response.data.data;
    },
  });

  // 获取订单列表
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders', searchText, statusFilter, methodFilter, dateRange],
    queryFn: () => paymentApi.getAdminOrders({
      search: searchText,
      status: statusFilter,
      method: methodFilter,
      startDate: dateRange[0]?.format('YYYY-MM-DD'),
      endDate: dateRange[1]?.format('YYYY-MM-DD'),
    }),
  });

  // 退款申请
  const refundMutation = useMutation({
    mutationFn: (data: { paymentId: string; amount: number; reason?: string }) =>
      paymentApi.requestRefund(data),
    onSuccess: () => {
      message.success('退款申请提交成功');
      setRefundModalVisible(false);
      refetchOrders();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '退款申请失败');
    },
  });

  const orders = ordersData?.data?.data || [];

  // 计算统计数据
  const totalOrders = stats?.totalOrders || 0;
  const paidOrders = stats?.paidOrders || 0;
  const totalAmount = stats?.totalAmount || 0;
  const todayOrders = stats?.todayOrders || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const successRate = stats?.successRate || '0.00';

  // 表格列定义
  const columns: ColumnsType<OrderItem> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>
      ),
    },
    {
      title: '订单信息',
      key: 'orderInfo',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{record.title}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.description || '无描述'}
          </div>
          <Tag color="blue" style={{ marginTop: 4 }}>
            {record.productType}
          </Tag>
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.user?.avatarUrl && (
            <img
              src={record.user.avatarUrl}
              alt="avatar"
              style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }}
            />
          )}
          <span>{record.user?.username || record.user?.nickname || '未知用户'}</span>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#f50' }}>
          ¥{(amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusInfo = orderStatusMap[status as keyof typeof orderStatusMap];
        return (
          <Tag color={statusInfo?.color} icon={statusInfo?.icon}>
            {statusInfo?.text || status}
          </Tag>
        );
      },
    },
    {
      title: '支付信息',
      key: 'payments',
      width: 150,
      render: (_, record) => {
        // 支付记录本身就是支付对象，不需要取payments[0]
        const payment = record;
        if (!payment) {
          return <span style={{ color: '#999' }}>暂无支付</span>;
        }

        const methodInfo = paymentMethodMap[payment.method as keyof typeof paymentMethodMap];
        const statusInfo = paymentStatusMap[payment.status as keyof typeof paymentStatusMap];

        return (
          <div>
            <Tag color={methodInfo?.color}>
              {methodInfo?.text}
            </Tag>
            <br />
            <Tag color={statusInfo?.color} style={{ marginTop: 4 }}>
              {statusInfo?.text}
            </Tag>
          </div>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setOrderDetailVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'paid' && record.payments?.[0]?.status === 'success' && (
            <Tooltip title="申请退款">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => {
                  if (record.payments?.[0]) {
                    setSelectedPayment(record.payments[0]);
                    setRefundModalVisible(true);
                  }
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 处理退款申请
  const handleRefund = (values: any) => {
    if (!selectedPayment) return;

    refundMutation.mutate({
      paymentId: selectedPayment.id,
      amount: values.amount * 100, // 转换为分
      reason: values.reason,
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>支付管理</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总订单数"
              value={totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已支付订单"
              value={paidOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总交易金额"
              value={totalAmount / 100}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#f50' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日订单"
              value={todayOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待支付订单"
              value={pendingOrders}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="支付成功率"
              value={successRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索订单号、用户昵称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="订单状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
              <Option value="expired">已过期</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="支付方式"
              value={methodFilter}
              onChange={setMethodFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => refetchOrders()}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('');
                  setMethodFilter('');
                  setDateRange([]);
                  refetchOrders();
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 订单列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={ordersLoading}
          pagination={{
            total: ordersData?.data?.pagination?.total || 0,
            pageSize: ordersData?.data?.pagination?.limit || 20,
            current: ordersData?.data?.pagination?.page || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号" span={2}>
                <span style={{ fontFamily: 'monospace' }}>{selectedOrder.orderNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="订单标题">{selectedOrder.title}</Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#f50', fontWeight: 'bold' }}>
                  ¥{(selectedOrder.amount / 100).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="商品类型">{selectedOrder.productType}</Descriptions.Item>
              <Descriptions.Item label="商品ID">{selectedOrder.productId}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Badge
                  status={selectedOrder.status === 'paid' ? 'success' : 'processing'}
                  text={orderStatusMap[selectedOrder.status as keyof typeof orderStatusMap]?.text}
                />
              </Descriptions.Item>
              <Descriptions.Item label="用户昵称">{selectedOrder.user.nickname}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {selectedOrder.expiresAt && (
                <Descriptions.Item label="过期时间">
                  {new Date(selectedOrder.expiresAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="订单描述" span={2}>
                {selectedOrder.description || '无描述'}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4>支付记录</h4>
                <Table
                  size="small"
                  dataSource={selectedOrder.payments}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: '支付流水号',
                      dataIndex: 'paymentNo',
                      render: (text: string) => (
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>
                      ),
                    },
                    {
                      title: '支付方式',
                      dataIndex: 'method',
                      render: (method: string) => {
                        const methodInfo = paymentMethodMap[method as keyof typeof paymentMethodMap];
                        return <Tag color={methodInfo?.color}>{methodInfo?.text}</Tag>;
                      },
                    },
                    {
                      title: '支付金额',
                      dataIndex: 'amount',
                      render: (amount: number) => `¥${(amount / 100).toFixed(2)}`,
                    },
                    {
                      title: '支付状态',
                      dataIndex: 'status',
                      render: (status: string) => {
                        const statusInfo = paymentStatusMap[status as keyof typeof paymentStatusMap];
                        return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>;
                      },
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createdAt',
                      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
                    },
                    {
                      title: '支付时间',
                      dataIndex: 'paidAt',
                      render: (date?: string) =>
                        date ? new Date(date).toLocaleString('zh-CN') : '-',
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 退款申请弹窗 */}
      <Modal
        title="申请退款"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        footer={null}
      >
        {selectedPayment && (
          <Form onFinish={handleRefund} layout="vertical">
            <Form.Item label="支付流水号">
              <span style={{ fontFamily: 'monospace' }}>{selectedPayment.paymentNo}</span>
            </Form.Item>
            <Form.Item label="支付金额">
              <span>¥{(selectedPayment.amount / 100).toFixed(2)}</span>
            </Form.Item>
            <Form.Item
              label="退款金额"
              name="amount"
              rules={[
                { required: true, message: '请输入退款金额' },
                {
                  type: 'number',
                  min: 0.01,
                  max: selectedPayment.amount / 100,
                  message: `退款金额必须在 0.01 - ${(selectedPayment.amount / 100).toFixed(2)} 之间`,
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入退款金额"
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
            <Form.Item label="退款原因" name="reason">
              <Input.TextArea
                placeholder="请输入退款原因（可选）"
                rows={3}
                maxLength={200}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={refundMutation.isPending}>
                  提交退款申请
                </Button>
                <Button onClick={() => setRefundModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default PaymentManagement;
