// 增强版图片上传组件
import { FileService } from '../../utils/file-service.js'

Component({
  properties: {
    // 最大上传数量
    maxCount: {
      type: Number,
      value: 9
    },
    // 图片质量 (0-1)
    quality: {
      type: Number,
      value: 0.8
    },
    // 是否启用裁剪
    enableCrop: {
      type: Boolean,
      value: false
    },
    // 裁剪比例 (宽:高)
    cropRatio: {
      type: String,
      value: '1:1'
    },
    // 是否启用压缩
    enableCompress: {
      type: Boolean,
      value: true
    },
    // 压缩后最大宽度
    maxWidth: {
      type: Number,
      value: 1080
    },
    // 已上传的图片列表
    value: {
      type: Array,
      value: []
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    imageList: [],
    uploading: false,
    uploadProgress: 0
  },

  observers: {
    'value': function(newVal) {
      this.setData({
        imageList: newVal || []
      })
    }
  },

  methods: {
    // 选择图片
    async chooseImage() {
      if (this.data.disabled || this.data.uploading) return
      
      const { maxCount, imageList } = this.data
      const remainCount = maxCount - imageList.length
      
      if (remainCount <= 0) {
        wx.showToast({
          title: `最多只能上传${maxCount}张图片`,
          icon: 'none'
        })
        return
      }

      try {
        const res = await this.selectImages(remainCount)
        if (res.tempFiles && res.tempFiles.length > 0) {
          await this.processAndUploadImages(res.tempFiles)
        }
      } catch (error) {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    },

    // 选择图片（兼容不同API）
    selectImages(count) {
      return new Promise((resolve, reject) => {
        // 优先使用新API
        if (wx.chooseMedia) {
          wx.chooseMedia({
            count: count,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            maxDuration: 30,
            camera: 'back',
            success: resolve,
            fail: reject
          })
        } else {
          // 兼容旧API
          wx.chooseImage({
            count: count,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
              resolve({
                tempFiles: res.tempFilePaths.map(path => ({ tempFilePath: path }))
              })
            },
            fail: reject
          })
        }
      })
    },

    // 处理和上传图片
    async processAndUploadImages(tempFiles) {
      this.setData({ uploading: true, uploadProgress: 0 })
      
      try {
        const processedImages = []
        const total = tempFiles.length

        for (let i = 0; i < tempFiles.length; i++) {
          const file = tempFiles[i]
          
          // 更新进度
          this.setData({
            uploadProgress: Math.round(((i + 1) / total) * 100)
          })

          // 图片处理
          let processedPath = file.tempFilePath
          
          if (this.data.enableCompress) {
            processedPath = await this.compressImage(processedPath)
          }
          
          if (this.data.enableCrop) {
            processedPath = await this.cropImage(processedPath)
          }

          // 上传图片
          const uploadResult = await FileService.uploadSingle(processedPath)
          
          if (uploadResult) {
            processedImages.push({
              url: uploadResult,
              tempPath: file.tempFilePath,
              uploadTime: Date.now()
            })
          }
        }

        // 更新图片列表
        const newImageList = [...this.data.imageList, ...processedImages]
        this.setData({ imageList: newImageList })
        
        // 触发change事件
        this.triggerEvent('change', {
          value: newImageList,
          added: processedImages
        })

        wx.showToast({
          title: `成功上传${processedImages.length}张图片`,
          icon: 'success'
        })

      } catch (error) {
        console.error('图片处理上传失败:', error)
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'error'
        })
      } finally {
        this.setData({ uploading: false, uploadProgress: 0 })
      }
    },

    // 压缩图片
    compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        const { quality, maxWidth } = this.data
        
        wx.compressImage({
          src: tempFilePath,
          quality: Math.round(quality * 100),
          compressedWidth: maxWidth,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        })
      })
    },

    // 裁剪图片
    cropImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        const { cropRatio } = this.data
        const [widthRatio, heightRatio] = cropRatio.split(':').map(Number)
        
        // 获取图片信息
        wx.getImageInfo({
          src: tempFilePath,
          success: (info) => {
            const { width, height } = info
            
            // 计算裁剪区域
            let cropWidth, cropHeight, x = 0, y = 0
            
            if (width / height > widthRatio / heightRatio) {
              // 图片偏宽，以高度为准
              cropHeight = height
              cropWidth = height * widthRatio / heightRatio
              x = (width - cropWidth) / 2
            } else {
              // 图片偏高，以宽度为准
              cropWidth = width
              cropHeight = width * heightRatio / widthRatio
              y = (height - cropHeight) / 2
            }

            // 执行裁剪
            const canvas = wx.createCanvasContext('cropCanvas', this)
            canvas.drawImage(tempFilePath, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
            canvas.draw(false, () => {
              wx.canvasToTempFilePath({
                canvasId: 'cropCanvas',
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              }, this)
            })
          },
          fail: reject
        })
      })
    },

    // 预览图片
    previewImage(e) {
      const { index } = e.currentTarget.dataset
      const { imageList } = this.data
      
      wx.previewImage({
        current: imageList[index].url,
        urls: imageList.map(item => item.url)
      })
    },

    // 删除图片
    deleteImage(e) {
      const { index } = e.currentTarget.dataset
      const { imageList } = this.data
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            const newImageList = imageList.filter((_, i) => i !== index)
            this.setData({ imageList: newImageList })
            
            this.triggerEvent('change', {
              value: newImageList,
              deleted: imageList[index]
            })
          }
        }
      })
    },

    // 重新排序
    onImageMove(e) {
      const { from, to } = e.detail
      const { imageList } = this.data

      const newImageList = [...imageList]
      const [movedItem] = newImageList.splice(from, 1)
      newImageList.splice(to, 0, movedItem)

      this.setData({ imageList: newImageList })

      this.triggerEvent('change', {
        value: newImageList,
        reordered: true
      })
    },

    // 简化版图片上传方法
    async uploadImageSimple(filePath) {
      try {
        // 暂时返回本地路径，后续可以集成真实的上传服务
        console.log('📸 模拟上传图片:', filePath)

        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 返回模拟的URL
        return `https://picsum.photos/400/600?random=${Date.now()}`

      } catch (error) {
        console.error('❌ 图片上传失败:', error)
        throw error
      }
    }
  }
})
