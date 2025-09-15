import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { message, notification } from 'antd';

interface WebSocketClientProps {
  onMessage?: (message: any) => void;
  onUserStatusChange?: (status: any) => void;
  onOnlineUsersUpdate?: (users: any[]) => void;
}

const WebSocketClient: React.FC<WebSocketClientProps> = ({
  onMessage,
  onUserStatusChange,
  onOnlineUsersUpdate,
}) => {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 连接WebSocket服务器
    const socket = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      auth: {
        // 这里应该使用真实的JWT token
        token: 'fake-admin-token',
      },
    });

    socketRef.current = socket;

    // 连接事件
    socket.on('connect', () => {
      console.log('WebSocket连接成功');
      setConnected(true);
      
      // 发送用户加入事件
      socket.emit('user_join', {
        id: 'admin',
        nickname: '管理员',
        role: 'admin',
      });

      notification.success({
        message: 'WebSocket连接成功',
        description: '实时消息功能已启用',
        duration: 3,
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket连接断开');
      setConnected(false);
      
      notification.warning({
        message: 'WebSocket连接断开',
        description: '实时消息功能已禁用',
        duration: 3,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
      setConnected(false);
      
      notification.error({
        message: 'WebSocket连接失败',
        description: error.message,
        duration: 5,
      });
    });

    // 在线用户列表更新
    socket.on('online_users', (users: any[]) => {
      console.log('在线用户更新:', users);
      setOnlineUsers(users);
      onOnlineUsersUpdate?.(users);
    });

    // 新消息
    socket.on('new_message', (messageData: any) => {
      console.log('收到新消息:', messageData);
      onMessage?.(messageData);
      
      // 显示消息通知
      notification.info({
        message: '新消息',
        description: `${messageData.sender?.nickname || '用户'}: ${messageData.content}`,
        duration: 4,
      });
    });

    // 用户状态变化
    socket.on('user_status_changed', (status: any) => {
      console.log('用户状态变化:', status);
      onUserStatusChange?.(status);
    });

    // 用户正在输入
    socket.on('user_typing', (data: any) => {
      console.log('用户正在输入:', data);
      // 可以在这里显示输入状态
    });

    // 消息已读
    socket.on('messages_read', (data: any) => {
      console.log('消息已读:', data);
    });

    // 系统通知
    socket.on('system_notification', (notification: any) => {
      console.log('系统通知:', notification);
      
      notification.info({
        message: '系统通知',
        description: JSON.stringify(notification),
        duration: 5,
      });
    });

    // 系统消息
    socket.on('system_message', (data: any) => {
      console.log('系统消息:', data);
      
      notification.warning({
        message: '系统消息',
        description: data.message,
        duration: 5,
      });
    });

    // 清理函数
    return () => {
      socket.disconnect();
    };
  }, [onMessage, onUserStatusChange, onOnlineUsersUpdate]);

  // 发送消息
  const sendMessage = (receiverId: string, content: string, type = 'text') => {
    if (socketRef.current && connected) {
      socketRef.current.emit('send_message', {
        receiverId,
        content,
        type,
      });
    } else {
      message.error('WebSocket未连接，无法发送消息');
    }
  };

  // 加入对话
  const joinConversation = (otherUserId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_conversation', {
        otherUserId,
      });
    }
  };

  // 离开对话
  const leaveConversation = (otherUserId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('leave_conversation', {
        otherUserId,
      });
    }
  };

  // 开始输入
  const startTyping = (otherUserId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_start', {
        otherUserId,
      });
    }
  };

  // 停止输入
  const stopTyping = (otherUserId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_stop', {
        otherUserId,
      });
    }
  };

  // 广播系统消息
  const broadcastSystemMessage = (messageContent: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('system_broadcast', {
        message: messageContent,
      });
    }
  };

  return (
    <div style={{ display: 'none' }}>
      {/* WebSocket客户端组件，不渲染任何UI */}
      {/* 可以通过props暴露方法给父组件使用 */}
    </div>
  );
};

// 全局WebSocket实例管理
let globalSocket: Socket | null = null;
let globalConnected = false;
let globalOnlineUsers: any[] = [];
let globalReconnectTimeout: NodeJS.Timeout | null = null;
let globalReconnectAttempts = 0;
const maxReconnectAttempts = 5;

// 状态更新回调列表
const stateCallbacks: Array<(state: { connected: boolean; onlineUsers: any[] }) => void> = [];

// 通知所有订阅者状态变化
const notifyStateChange = () => {
  const state = { connected: globalConnected, onlineUsers: globalOnlineUsers };
  stateCallbacks.forEach(callback => callback(state));
};

// 导出WebSocket客户端实例和方法
export const useWebSocket = () => {
  const [connected, setConnected] = useState(globalConnected);
  const [onlineUsers, setOnlineUsers] = useState<any[]>(globalOnlineUsers);
  const [reconnectAttempts, setReconnectAttempts] = useState(globalReconnectAttempts);

  // 注册状态变化回调
  useEffect(() => {
    const callback = (state: { connected: boolean; onlineUsers: any[] }) => {
      setConnected(state.connected);
      setOnlineUsers(state.onlineUsers);
      setReconnectAttempts(globalReconnectAttempts);
    };

    stateCallbacks.push(callback);

    return () => {
      const index = stateCallbacks.indexOf(callback);
      if (index > -1) {
        stateCallbacks.splice(index, 1);
      }
    };
  }, []);

  const connect = useCallback(() => {
    // 如果已经连接，直接返回
    if (globalSocket?.connected) {
      return;
    }

    // 清理现有连接
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    console.log('正在连接WebSocket服务器...');

    // 使用当前服务器地址而不是localhost:3002
    const wsUrl = window.location.protocol === 'https:'
      ? `wss://${window.location.host}`
      : `ws://${window.location.host}`;

    console.log('WebSocket URL:', wsUrl);

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true,
      // 禁用自动连接，避免连接失败
      autoConnect: false,
    });

    globalSocket = socket;

    socket.on('connect', () => {
      console.log('WebSocket连接成功');
      globalConnected = true;
      globalReconnectAttempts = 0;

      // 清理重连定时器
      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout);
        globalReconnectTimeout = null;
      }

      socket.emit('user_join', {
        id: 'admin',
        nickname: '管理员',
        role: 'admin',
      });

      notification.success({
        message: 'WebSocket连接成功',
        description: '实时消息功能已启用',
        duration: 2,
      });

      notifyStateChange();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket连接断开:', reason);
      globalConnected = false;

      notification.warning({
        message: 'WebSocket连接断开',
        description: '实时消息功能已禁用',
        duration: 2,
      });

      notifyStateChange();

      // 如果不是主动断开，尝试重连
      if (reason !== 'io client disconnect' && globalReconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, globalReconnectAttempts), 10000); // 指数退避，最大10秒
        console.log(`${delay}ms后尝试重连...`);

        globalReconnectTimeout = setTimeout(() => {
          globalReconnectAttempts++;
          connect();
        }, delay);
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket连接错误 (这是正常的，因为当前没有WebSocket服务):', error.message);
      globalConnected = false;
      notifyStateChange();

      // 不显示错误通知，因为WebSocket是可选功能
      console.log('WebSocket连接失败，但不影响其他功能的使用');
    });

    socket.on('online_users', (users: any[]) => {
      globalOnlineUsers = users;
      notifyStateChange();
    });

    // 其他事件监听
    socket.on('new_message', (message: any) => {
      console.log('收到新消息:', message);
    });

    socket.on('user_status_changed', (status: any) => {
      console.log('用户状态变化:', status);
    });
  }, []);

  const disconnect = useCallback(() => {
    console.log('主动断开WebSocket连接');

    // 清理重连定时器
    if (globalReconnectTimeout) {
      clearTimeout(globalReconnectTimeout);
      globalReconnectTimeout = null;
    }

    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    globalConnected = false;
    globalReconnectAttempts = 0;
    notifyStateChange();
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string, type = 'text') => {
    if (globalSocket?.connected) {
      globalSocket.emit('send_message', {
        receiverId,
        content,
        type,
      });
    } else {
      message.error('WebSocket未连接，无法发送消息');
    }
  }, []);

  return {
    connected,
    onlineUsers,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts,
  };
};

export default WebSocketClient;
