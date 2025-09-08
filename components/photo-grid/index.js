// 得物风格瀑布流组件
// 导入认证和Supabase服务
import { authService } from '../../utils/auth.js';
import { supabase } from '../../utils/supabase-client.js';

Component({
  properties: {
    works: {
      type: Array,
      value: [],
      observer: function(newWorks) {
        this.onWorksChange(newWorks);
      }
    }
  },

  data: {
    leftColumn: [],
    rightColumn: [],
    leftHeight: 0,
    rightHeight: 0
  },

  methods: {
    // 监听作品数据变化，重新分配到左右列
    onWorksChange(newWorks) {
      if (!newWorks || newWorks.length === 0) {
        this.setData({
          leftColumn: [],
          rightColumn: [],
          leftHeight: 0,
          rightHeight: 0
        });
        return;
      }

      this.distributeWorks(newWorks);
    },

    // 分配作品到左右两列，实现瀑布流效果
    distributeWorks(works) {
      const leftColumn = [];
      const rightColumn = [];
      let leftHeight = 0;
      let rightHeight = 0;

      works.forEach((work) => {
        // 计算图片高度（基于宽高比）
        const imageHeight = this.calculateImageHeight(work);
        const cardHeight = imageHeight + 110; // 图片高度 + 信息区域高度(更紧凑)

        // 选择高度较小的列
        if (leftHeight <= rightHeight) {
          leftColumn.push({...work, imageHeight, cardHeight});
          leftHeight += cardHeight + 12; // 加上间距
        } else {
          rightColumn.push({...work, imageHeight, cardHeight});
          rightHeight += cardHeight + 12;
        }
      });

      this.setData({
        leftColumn,
        rightColumn,
        leftHeight,
        rightHeight
      });
    },

    // 计算图片显示高度
    calculateImageHeight(work) {
      try {
        // 基础宽度（屏幕宽度的一半减去间距）
        const baseWidth = 347; // rpx (750/2 - 20*2 - 8)

        // 如果有图片尺寸信息，按比例计算
        if (work && work.imageWidth && work.imageHeight) {
          const calculatedHeight = (baseWidth * work.imageHeight) / work.imageWidth;
          // 限制最小和最大高度，避免过于极端的比例
          return Math.max(300, Math.min(800, calculatedHeight));
        }

        // 默认随机高度，模拟不同比例的图片
        const ratios = [1.1, 1.3, 1.5, 1.7, 1.9];
        const randomRatio = ratios[Math.floor(Math.random() * ratios.length)];
        return baseWidth * randomRatio;
      } catch (error) {
        console.error('计算图片高度错误:', error);
        return 400; // 返回默认高度
      }
    },

    onWorkTap(e) {
      try {
        const { work } = e.currentTarget.dataset;
        if (work) {
          // 添加触觉反馈
          wx.vibrateShort({ type: 'light' });

          // 跳转到详情页面
          wx.navigateTo({
            url: `/pages/detail/index?id=${work.id || work.workId || 'default'}`
          });

          // 触发父组件事件
          this.triggerEvent('worktap', { work });
        }
      } catch (error) {
        console.error('组件作品点击错误:', error);
      }
    },

    async onLikeTap(e) {
      try {
        const { work } = e.currentTarget.dataset;
        if (!work) return;

        // 阻止事件冒泡
        e.stopPropagation();

        // 🔐 检查登录状态
        if (!authService.checkLoginStatus()) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          return;
        }

        const currentUser = authService.getCurrentUser();
        console.log('❤️ 点赞操作:', work.title, '用户:', currentUser.nickname);

        // 添加触觉反馈
        wx.vibrateShort({ type: 'light' });

        // 🎯 执行点赞/取消点赞
        await this.toggleLike(work, currentUser);

      } catch (error) {
        console.error('❌ 点赞操作错误:', error);
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        });
      }
    },

    // ❤️ 切换点赞状态
    async toggleLike(work, currentUser) {
      try {
        const workId = work.id;
        const userId = currentUser.id;

        console.log('🔍 检查点赞状态...', { workId, userId });

        // 查询是否已点赞
        const { data: existingLikes } = await supabase.select('likes', {
          eq: { work_id: workId, user_id: userId },
          select: 'id'
        });

        const isCurrentlyLiked = existingLikes && existingLikes.length > 0;
        console.log('📊 当前点赞状态:', isCurrentlyLiked);

        if (isCurrentlyLiked) {
          // 🗑️ 取消点赞
          await this.removeLike(workId, userId, work);
        } else {
          // ❤️ 添加点赞
          await this.addLike(workId, userId, work);
        }

      } catch (error) {
        console.error('❌ 点赞状态切换失败:', error);
        throw error;
      }
    },

    // ❤️ 添加点赞
    async addLike(workId, userId, work) {
      try {
        // 插入点赞记录
        const likeResult = await supabase.insert('likes', {
          work_id: workId,
          user_id: userId
        });

        if (likeResult.error) {
          throw new Error(`点赞失败: ${likeResult.error.message}`);
        }

        // 更新作品点赞数
        const updateResult = await supabase.update('works',
          { like_count: (work.stats?.likes || 0) + 1 },
          { eq: { id: workId } }
        );

        if (updateResult.error) {
          console.warn('⚠️ 更新点赞数失败:', updateResult.error);
        }

        console.log('✅ 点赞成功');

        // 触发父组件更新
        this.triggerEvent('like', {
          work: work,
          isLiked: true,
          newLikeCount: (work.stats?.likes || 0) + 1
        });

        wx.showToast({
          title: '点赞成功',
          icon: 'success',
          duration: 1000
        });

      } catch (error) {
        console.error('❌ 添加点赞失败:', error);
        throw error;
      }
    },

    // 🗑️ 取消点赞
    async removeLike(workId, userId, work) {
      try {
        // 删除点赞记录
        const deleteResult = await supabase.delete('likes', {
          eq: { work_id: workId, user_id: userId }
        });

        if (deleteResult.error) {
          throw new Error(`取消点赞失败: ${deleteResult.error.message}`);
        }

        // 更新作品点赞数
        const newLikeCount = Math.max(0, (work.stats?.likes || 0) - 1);
        const updateResult = await supabase.update('works',
          { like_count: newLikeCount },
          { eq: { id: workId } }
        );

        if (updateResult.error) {
          console.warn('⚠️ 更新点赞数失败:', updateResult.error);
        }

        console.log('✅ 取消点赞成功');

        // 触发父组件更新
        this.triggerEvent('like', {
          work: work,
          isLiked: false,
          newLikeCount: newLikeCount
        });

        wx.showToast({
          title: '已取消点赞',
          icon: 'none',
          duration: 1000
        });

      } catch (error) {
        console.error('❌ 取消点赞失败:', error);
        throw error;
      }
    },

    onUserTap(e) {
      try {
        const { userId } = e.currentTarget.dataset;
        if (userId) {
          this.triggerEvent('usertap', { userId });
        }
        e.stopPropagation();
      } catch (error) {
        console.error('组件用户点击错误:', error);
      }
    }
  }
});
