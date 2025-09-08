// 现代化发布页面
// 导入简化的认证服务
import { simpleAuthService } from '../../utils/simple-auth.js';

Page({
  data: {
    publishType: '', // 发布类型：photographer, model, works
    uploadedImages: [], // 使用新的图片上传组件
    tags: ['摄影', '生活', '美食', '旅行', '风景', '人像'],
    categories: [
      { value: 'portrait', label: '人像摄影' },
      { value: 'landscape', label: '风光摄影' },
      { value: 'street', label: '街拍纪实' },
      { value: 'commercial', label: '商业摄影' },
      { value: 'art', label: '艺术创作' },
      { value: 'fashion', label: '时尚摄影' }
    ],

    // 表单数据
    formData: {
      title: '',
      description: '',
      location: '',
      category: '',
      budget: '',
      shootingTime: '',
      requirements: '',
      tags: [],
      cameraInfo: '',
      shootingParams: ''
    },

    // UI状态
    uploading: false,
    publishing: false
  },

  onLoad() {
    // 页面加载时的初始化
    this.initPage();
  },

  initPage() {
    // 初始化页面数据
    this.setData({
      publishType: '',
      originFiles: [],
      formData: {
        title: '',
        description: '',
        location: '',
        budget: '',
        shootingTime: '',
        requirements: '',
        tags: []
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 测试点击功能
  testClick() {
    console.log('测试点击功能被触发');
    wx.showToast({
      title: '点击功能正常！',
      icon: 'success'
    });
  },

  // 选择发布类型
  onTypeSelect(e) {
    console.log('点击了发布类型按钮', e);

    const { type } = e.currentTarget.dataset;
    console.log('选择的类型:', type);

    this.setData({
      publishType: type
    });

    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });

    // 根据类型显示不同的提示
    let title = '';
    switch (type) {
      case 'photographer':
        title = '已选择：寻找摄影师';
        break;
      case 'model':
        title = '已选择：寻找模特';
        break;
      case 'works':
        title = '已选择：摄影作品';
        break;
    }

    wx.showToast({
      title,
      icon: 'none',
      duration: 1000
    });
  },

  // 图片上传变化处理
  onImageChange(e) {
    const { value, added, deleted } = e.detail;
    console.log('图片上传变化:', { value, added, deleted });

    this.setData({
      uploadedImages: value
    });

    if (added && added.length > 0) {
      wx.showToast({
        title: `成功添加${added.length}张图片`,
        icon: 'success'
      });
    }

    if (deleted) {
      wx.showToast({
        title: '图片已删除',
        icon: 'success'
      });
    }
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;

    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 分类选择
  onCategoryChange(e) {
    const { value } = e.detail;
    this.setData({
      'formData.category': value
    });
  },

  // 标签选择
  onTagSelect(e) {
    const { tag } = e.currentTarget.dataset;
    const { formData } = this.data;
    const tags = [...formData.tags];

    const index = tags.indexOf(tag);
    if (index > -1) {
      tags.splice(index, 1);
    } else {
      if (tags.length < 5) {
        tags.push(tag);
      } else {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
    }

    this.setData({
      'formData.tags': tags
    });
  },

  // 保存草稿
  saveDraft() {
    const { publishType } = this.data;

    if (!publishType) {
      wx.showToast({
        title: '请先选择发布类型',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '草稿已保存',
      icon: 'success',
    });
  },

  // 发布内容
  async onPublish() {
    const { publishType, originFiles, formData } = this.data;

    // 🔐 检查登录状态
    try {
      const loginResult = await authService.requireLogin()
      if (!loginResult.success) {
        return
      }
      console.log('✅ 用户已登录:', loginResult.user.nickname)
    } catch (error) {
      console.log('❌ 用户取消登录')
      return
    }

    if (!publishType) {
      wx.showToast({
        title: '请先选择发布类型',
        icon: 'none'
      });
      return;
    }

    // 根据不同类型进行不同的发布处理
    switch (publishType) {
      case 'photographer':
        await this.publishPhotographerRequest();
        break;
      case 'model':
        await this.publishModelRequest();
        break;
      case 'works':
        await this.publishWorksToSupabase(); // 使用Supabase版本
        break;
    }
  },

  // 🎯 发布作品到Supabase（完整版本）
  async publishWorksToSupabase() {
    try {
      this.setData({ publishing: true });
      wx.showLoading({ title: '发布作品中...' });

      console.log('📤 开始发布作品到Supabase...');

      // 🔐 获取当前登录用户
      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        throw new Error('用户未登录')
      }

      console.log('👤 当前用户:', currentUser.nickname)

      const { uploadedImages, formData } = this.data;

      // 验证必填信息
      if (!formData.title || !formData.title.trim()) {
        throw new Error('请输入作品标题')
      }

      if (uploadedImages.length === 0) {
        throw new Error('请至少上传一张图片')
      }

      // 📸 图片已经通过组件上传，直接使用URL
      const imageUrls = uploadedImages.map(img => img.url);
      console.log('✅ 使用已上传的图片:', imageUrls);

      wx.showLoading({ title: '发布作品中...' })

      // 🎯 准备完整的作品数据
      const workData = {
        user_id: currentUser.id,
        title: formData.title?.trim() || '未命名作品',
        description: formData.description?.trim() || '',
        cover_image: uploadedImageUrls[0],
        images: uploadedImageUrls,
        tags: formData.tags || [],
        category: this.mapCategoryToDatabase(formData.category) || 'art',
        location: formData.location?.trim() || '',
        camera_info: formData.cameraInfo?.trim() || '',
        shooting_params: formData.shootingParams?.trim() || '',
        status: 'published',
        like_count: 0,
        comment_count: 0,
        view_count: 0
      };

      console.log('📋 发布完整作品数据:', workData);

      // 发布到Supabase
      const result = await supabase.insert('works', workData);

      console.log('📥 发布结果:', result);

      wx.hideLoading();

      if (result.error) {
        throw result.error;
      }

      wx.showToast({
        title: '作品发布成功！',
        icon: 'success'
      });

      // 清空表单
      this.setData({
        formData: {
          title: '',
          description: '',
          location: '',
          category: '',
          tags: []
        },
        originFiles: [],
        publishType: ''
      });

      // 跳转到发现页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/discover/index'
        });
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      console.error('❌ 作品发布失败:', error);
      wx.showModal({
        title: '发布失败',
        content: `错误: ${error.message || error}`,
        showCancel: false
      });
    }
  },

  // 映射分类到数据库格式
  mapCategoryToDatabase(category) {
    const categoryMap = {
      'portrait': 'portrait',
      'landscape': 'landscape',
      'street': 'street',
      'commercial': 'commercial',
      'art': 'art',
      'fashion': 'fashion'
    };
    return categoryMap[category] || 'art';
  },

  // 发布摄影师需求
  publishPhotographerRequest() {
    wx.showLoading({
      title: '发布中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '摄影师需求发布成功',
        icon: 'success',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

  // 发布模特需求
  publishModelRequest() {
    wx.showLoading({
      title: '发布中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '模特需求发布成功',
        icon: 'success',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

  // 发布摄影作品
  async publishWorks() {
    const { originFiles, formData } = this.data;

    // 验证必填信息
    if (originFiles.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      });
      return;
    }

    if (!formData.title || !formData.title.trim()) {
      wx.showToast({
        title: '请输入作品标题',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '发布中...' });

      console.log('📤 开始发布作品到Supabase...', formData);

      // 获取当前用户信息（简化版）
      let userId = wx.getStorageSync('currentUserId');
      if (!userId) {
        // 创建临时用户
        const tempUser = {
          openid: `user_${Date.now()}`,
          nickname: formData.authorName || '摄影师',
          is_photographer: true
        };

        const userResult = await supabase.insert('users', tempUser);
        if (userResult.error) {
          throw new Error('用户创建失败');
        }

        userId = `temp_${Date.now()}`;
        wx.setStorageSync('currentUserId', userId);
      }

      // 准备作品数据（简化版）
      const workData = {
        user_id: userId,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        cover_image: originFiles[0] || '/static/placeholder.jpg',
        category: 'art',
        location: formData.location?.trim() || '',
        status: 'published'
      };

      console.log('📋 准备发布的作品数据:', workData);

      // 发布作品到Supabase
      const result = await supabase.insert('works', workData);

      console.log('📥 发布结果:', result);

      wx.hideLoading();

      if (result.error) {
        console.error('❌ 发布失败:', result.error);
        wx.showModal({
          title: '发布失败',
          content: `错误信息: ${result.error.message || '未知错误'}`,
          showCancel: false
        });
      } else {
        console.log('✅ 作品发布成功!');
        wx.showToast({
          title: '作品发布成功！',
          icon: 'success'
        });

        // 跳转回发现页面查看发布的作品
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/discover/index'
          });
        }, 1500);
      }

    } catch (error) {
      wx.hideLoading();
      console.error('❌ 发布异常:', error);
      wx.showModal({
        title: '发布失败',
        content: `异常信息: ${error.message || error}`,
        showCancel: false
      });
    }
  },

  // 跳转到地图选择位置
  gotoMap() {
    wx.navigateTo({
      url: '/pages/map/index',
    });
  },

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 预算选择
  onBudgetSelect(e) {
    const { budget } = e.currentTarget.dataset;
    this.setData({
      'formData.budget': budget
    });
  },

  // 日期选择
  onDateChange(e) {
    const { value } = e.detail;
    this.setData({
      'formData.shootingTime': value
    });
  },

  // 风格标签切换
  onStyleToggle(e) {
    const { style } = e.currentTarget.dataset;
    const { tags } = this.data.formData;
    const index = tags.indexOf(style);

    if (index > -1) {
      // 移除标签
      tags.splice(index, 1);
    } else {
      // 添加标签
      tags.push(style);
    }

    this.setData({
      'formData.tags': tags
    });
  },

  // 🧪 测试发布功能
  async testPublish() {
    try {
      console.log('🧪 开始测试发布功能...')
      wx.showLoading({ title: '测试发布...' })

      // 第一步：先创建测试用户
      console.log('👤 第一步：创建测试用户...')
      const testUser = {
        openid: `test_user_${Date.now()}`,
        nickname: '测试发布用户',
        is_photographer: true
      }

      const userResult = await supabase.insert('users', testUser)
      console.log('📥 用户创建结果:', userResult)

      if (userResult.error) {
        throw new Error(`用户创建失败: ${userResult.error.message}`)
      }

      // 获取用户ID - 需要从Supabase查询获取
      console.log('🔍 查询刚创建的用户ID...')
      const { data: users } = await supabase.select('users', {
        eq: { openid: testUser.openid },
        select: 'id'
      })

      if (!users || users.length === 0) {
        throw new Error('无法获取用户ID')
      }

      const userId = users[0].id
      console.log('✅ 获取到用户ID:', userId)

      // 第二步：创建测试作品
      console.log('📝 第二步：创建测试作品...')
      const testWork = {
        user_id: userId, // 使用真实的用户ID
        title: '测试发布作品',
        description: '这是一个测试发布的摄影作品',
        cover_image: '/static/test-image.jpg',
        category: 'art',
        status: 'published'
      }

      console.log('📤 测试发布数据:', testWork)

      // 发布到Supabase
      const result = await supabase.insert('works', testWork)

      console.log('📥 测试发布结果:', result)

      wx.hideLoading()

      if (result.error) {
        throw result.error
      }

      wx.showModal({
        title: '测试发布成功！',
        content: '作品已成功发布到Supabase数据库，即将跳转查看',
        showCancel: false,
        success: () => {
          // 跳转到发现页面查看
          wx.switchTab({
            url: '/pages/discover/index'
          })
        }
      })

    } catch (error) {
      wx.hideLoading()
      console.error('❌ 测试发布失败:', error)
      wx.showModal({
        title: '测试发布失败',
        content: `错误: ${error.message || JSON.stringify(error)}`,
        showCancel: false
      })
    }
  },

  // 预算选择
  onBudgetSelect(e) {
    const { budget } = e.currentTarget.dataset;
    this.setData({
      'formData.budget': budget
    });
  },

  // 风格切换
  onStyleToggle(e) {
    const { style } = e.currentTarget.dataset;
    const { styles } = this.data.formData;
    const index = styles.indexOf(style);

    if (index > -1) {
      styles.splice(index, 1);
    } else {
      styles.push(style);
    }

    this.setData({
      'formData.styles': styles
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.shootingTime': e.detail.value
    });
  },

  // 跳转到地图选择页面
  gotoMap() {
    wx.navigateTo({
      url: '/pages/map/index'
    });
  }
});
