import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  CalendarOutlined,
  MessageOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'

const { Header, Sider, Content } = Layout

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  // 菜单项配置
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/works',
      icon: <PictureOutlined />,
      label: '作品管理',
    },
    {
      key: '/appointments',
      icon: <CalendarOutlined />,
      label: '约拍管理',
    },
    {
      key: '/messages',
      icon: <MessageOutlined />,
      label: '消息管理',
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: '支付管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ]

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => {
        // TODO: 打开个人资料编辑弹窗
      },
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          minHeight: '100vh',
          height: 'auto'
        }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 16,
        }}>
          {collapsed ? '懂拍' : '懂拍帝管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout>
        <Header 
          className="admin-header"
          style={{ 
            padding: 0, 
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: 24 }}>
            <span>欢迎，{user?.username || user?.email}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Avatar 
                src={user?.avatarUrl} 
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        </Header>
        
        <Content className="admin-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
