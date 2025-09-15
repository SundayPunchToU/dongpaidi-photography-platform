import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Modal,
  message,
  Tooltip,
  Badge,
  Typography,
  Divider,
  List,
  Empty,
} from 'antd';
import {
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  WifiOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '@/services/api';
import { useWebSocket } from '@/components/WebSocketClient';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface MessageItem {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    nickname?: string;
    username?: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    nickname?: string;
    username?: string;
    avatarUrl?: string;
  };
}

interface ConversationItem {
  userId: string;
  user: {
    id: string;
    nickname?: string;
    username?: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
}

const MessageManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<MessageItem[]>([]);
  const [realTimeMessages, setRealTimeMessages] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // WebSocket连接
  const { connected, onlineUsers, connect, disconnect, sendMessage } = useWebSocket();

  // 初始化WebSocket连接
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // 获取对话列表
  const { data: conversationsData, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
  });

  // 获取未读消息统计
  const { data: unreadCountData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messageApi.getUnreadCount,
  });

  const conversations = conversationsData?.data?.data || [];
  const unreadCount = unreadCountData?.data?.data?.count || 0;

  // 计算统计数据
  const totalConversations = conversations.length;
  const activeConversations = conversations.filter((conv: any) => conv.unreadCount > 0).length;
  const onlineUsersCount = onlineUsers.length;

  // 获取对话消息
  const fetchConversationMessages = async (otherUserId: string) => {
    try {
      const response = await messageApi.getConversationMessages(otherUserId);
      setConversationMessages(response.data.data || []);
    } catch (error) {
      message.error('获取对话消息失败');
    }
  };

  // 标记消息已读
  const markAsReadMutation = useMutation({
    mutationFn: (otherUserId: string) => messageApi.markAsRead(otherUserId),
    onSuccess: () => {
      message.success('消息已标记为已读');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: () => {
      message.error('标记已读失败');
    },
  });

  // 查看对话详情
  const handleViewConversation = async (conversation: ConversationItem) => {
    setSelectedConversation(conversation);
    setMessageModalVisible(true);
    await fetchConversationMessages(conversation.userId);
    
    // 如果有未读消息，标记为已读
    if (conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversation.userId);
    }
  };

  // 过滤对话列表
  const filteredConversations = conversations.filter((conversation: any) =>
    (conversation.user?.nickname || conversation.user?.username || '').toLowerCase().includes(searchText.toLowerCase()) ||
    conversation.lastMessage?.content.toLowerCase().includes(searchText.toLowerCase())
  );

  // 对话列表表格列配置
  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (record: ConversationItem) => (
        <Space>
          <Badge dot={record.user.isOnline} color="green">
            <Avatar 
              src={record.user.avatarUrl} 
              icon={<UserOutlined />}
              size={40}
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.user?.nickname || record.user?.username || '未知用户'}
              {record.user?.isOnline && (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  <WifiOutlined /> 在线
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.user?.id || '未知'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '最后消息',
      key: 'lastMessage',
      render: (record: ConversationItem) => {
        if (!record.lastMessage) {
          return <Text type="secondary">暂无消息</Text>;
        }
        
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text ellipsis style={{ maxWidth: 200 }}>
                {record.lastMessage.content}
              </Text>
            </div>
            <Space size="small">
              <Tag color={record.lastMessage.type === 'system' ? 'orange' : 'blue'}>
                {record.lastMessage.type === 'text' ? '文本' : 
                 record.lastMessage.type === 'image' ? '图片' : '系统'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {new Date(record.lastMessage.createdAt).toLocaleString()}
              </Text>
            </Space>
          </div>
        );
      },
    },
    {
      title: '未读消息',
      key: 'unreadCount',
      align: 'center' as const,
      render: (record: ConversationItem) => (
        record.unreadCount > 0 ? (
          <Badge count={record.unreadCount} style={{ backgroundColor: '#f5222d' }} />
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '操作',
      key: 'actions',
      align: 'center' as const,
      render: (record: ConversationItem) => (
        <Space>
          <Tooltip title="查看对话">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewConversation(record)}
            />
          </Tooltip>
          {record.unreadCount > 0 && (
            <Tooltip title="标记已读">
              <Button
                icon={<MessageOutlined />}
                size="small"
                onClick={() => markAsReadMutation.mutate(record.userId)}
                loading={markAsReadMutation.isPending}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <MessageOutlined /> 消息管理
        </Title>
        <Text type="secondary">管理用户对话和消息记录</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总对话数"
              value={totalConversations}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃对话"
              value={activeConversations}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={onlineUsersCount}
              prefix={<WifiOutlined />}
              valueStyle={{ color: connected ? '#52c41a' : '#faad14' }}
              suffix={connected ? '(实时)' : '(离线)'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未读消息"
              value={unreadCount}
              prefix={<Badge dot />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 对话列表 */}
      <Card
        title="对话列表"
        extra={
          <Space>
            <Search
              placeholder="搜索用户或消息内容"
              allowClear
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchConversations()}
              loading={conversationsLoading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredConversations}
          rowKey="userId"
          loading={conversationsLoading}
          pagination={{
            total: filteredConversations.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个对话`,
          }}
          locale={{
            emptyText: <Empty description="暂无对话记录" />,
          }}
        />
      </Card>

      {/* 对话详情弹窗 */}
      <Modal
        title={
          selectedConversation ? (
            <Space>
              <Avatar 
                src={selectedConversation.user.avatarUrl} 
                icon={<UserOutlined />}
              />
              <span>与 {selectedConversation.user?.nickname || selectedConversation.user?.username || '未知用户'} 的对话</span>
              {selectedConversation.user?.isOnline && (
                <Tag color="green">
                  <WifiOutlined /> 在线
                </Tag>
              )}
            </Space>
          ) : '对话详情'
        }
        open={messageModalVisible}
        onCancel={() => {
          setMessageModalVisible(false);
          setSelectedConversation(null);
          setConversationMessages([]);
        }}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {conversationMessages.length > 0 ? (
            <List
              dataSource={conversationMessages}
              renderItem={(message) => (
                <List.Item
                  style={{
                    justifyContent: message.sender.id === 'current-user' ? 'flex-end' : 'flex-start',
                    border: 'none',
                    padding: '8px 0',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: message.sender.id === 'current-user' ? '#1890ff' : '#f0f0f0',
                      color: message.sender.id === 'current-user' ? 'white' : 'black',
                    }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      <Text 
                        style={{ 
                          fontSize: '12px', 
                          color: message.sender.id === 'current-user' ? 'rgba(255,255,255,0.8)' : '#999',
                        }}
                      >
                        {message.sender.nickname} • {new Date(message.createdAt).toLocaleString()}
                      </Text>
                    </div>
                    <div>{message.content}</div>
                    {message.type !== 'text' && (
                      <Tag style={{ marginTop: '4px' }}>
                        {message.type === 'image' ? '图片' : '系统'}
                      </Tag>
                    )}
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无消息记录" />
          )}
        </div>
      </Modal>


    </div>
  );
};

export default MessageManagement;
