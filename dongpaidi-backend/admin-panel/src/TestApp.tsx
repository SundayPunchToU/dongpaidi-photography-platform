import React from 'react'
import { Button, Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

function TestApp() {
  return (
    <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🎉 React应用加载成功！</Title>
        <Paragraph>
          如果您能看到这个页面，说明React应用已经正常加载。
        </Paragraph>
        
        <div style={{ marginTop: '20px' }}>
          <Button 
            type="primary" 
            onClick={() => alert('按钮点击成功！')}
            style={{ marginRight: '10px' }}
          >
            测试按钮
          </Button>
          
          <Button 
            onClick={() => {
              console.log('控制台测试')
              window.location.href = '/admin'
            }}
          >
            返回管理后台
          </Button>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>调试信息：</strong>
          <ul>
            <li>当前时间: {new Date().toLocaleString()}</li>
            <li>当前URL: {window.location.href}</li>
            <li>用户代理: {navigator.userAgent.substring(0, 100)}...</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default TestApp
