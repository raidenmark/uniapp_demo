/**
 * Vite文件服务器插件
 * 为本地开发环境提供真实的文件上传和存储服务
 */

import { Plugin } from 'vite'
import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

// 文件存储配置
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
const DATA_DIR = path.join(process.cwd(), 'data')
const FILES_DB = path.join(DATA_DIR, 'files.json')

// 文件记录接口
interface FileRecord {
  id: string
  fileName: string
  originalName: string
  fileType: 'image' | 'video' | 'other'
  fileUrl: string
  fileSize: number
  uploadTime: string
  userId: string
  platform: string
  status: number
  thumbnail?: string
}

// 数据库操作类
class FileDatabase {
  private dbPath: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.init()
  }

  private init() {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    
    // 如果数据库文件不存在，创建空数组
    if (!fs.existsSync(this.dbPath)) {
      this.saveData([])
    }
  }

  private loadData(): FileRecord[] {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('读取数据库失败:', error)
      return []
    }
  }

  private saveData(data: FileRecord[]) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error('保存数据库失败:', error)
    }
  }

  // 添加文件记录
  add(record: Omit<FileRecord, 'id'>): FileRecord {
    const data = this.loadData()
    const newRecord: FileRecord = {
      ...record,
      id: this.generateId()
    }
    data.push(newRecord)
    this.saveData(data)
    return newRecord
  }

  // 获取文件列表
  getList(options: {
    userId?: string
    fileType?: string
    page?: number
    pageSize?: number
  } = {}): { list: FileRecord[], total: number } {
    let data = this.loadData()
    
    // 用户过滤
    if (options.userId) {
      data = data.filter(f => f.userId === options.userId && f.status === 1)
    }

    // 类型过滤
    if (options.fileType && options.fileType !== 'all') {
      data = data.filter(f => f.fileType === options.fileType)
    }

    // 排序：按上传时间倒序
    data.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())

    const total = data.length
    
    // 分页
    const page = options.page || 1
    const pageSize = options.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    return {
      list: data.slice(start, end),
      total
    }
  }

  // 删除文件记录
  delete(id: string): boolean {
    const data = this.loadData()
    const index = data.findIndex(f => f.id === id)
    if (index !== -1) {
      data.splice(index, 1)
      this.saveData(data)
      return true
    }
    return false
  }

  // 软删除
  softDelete(id: string): boolean {
    const data = this.loadData()
    const record = data.find(f => f.id === id)
    if (record) {
      record.status = 0
      this.saveData(data)
      return true
    }
    return false
  }

  private generateId(): string {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

// 工具函数
const getFileType = (mimetype: string): 'image' | 'video' | 'other' => {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  return 'other'
}

const ensureUploadDirs = () => {
  const dirs = [
    UPLOADS_DIR,
    path.join(UPLOADS_DIR, 'images'),
    path.join(UPLOADS_DIR, 'videos'),
    path.join(UPLOADS_DIR, 'others')
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

export default function fileServerPlugin(): Plugin {
  const db = new FileDatabase(FILES_DB)
  
  return {
    name: 'file-server',
    configureServer(server) {
      // 确保上传目录存在
      ensureUploadDirs()
      
      const app = express()
      
      // 中间件
      app.use(cors())
      app.use(express.json())
      
      // 配置multer
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          const fileType = getFileType(file.mimetype)
          const uploadPath = path.join(UPLOADS_DIR, fileType + 's')
          cb(null, uploadPath)
        },
        filename: (req, file, cb) => {
          // 生成唯一文件名
          const timestamp = Date.now()
          const random = Math.random().toString(36).substr(2, 9)
          const ext = path.extname(file.originalname)
          const filename = `${timestamp}_${random}${ext}`
          cb(null, filename)
        }
      })
      
      const upload = multer({ 
        storage,
        limits: {
          fileSize: 50 * 1024 * 1024 // 50MB
        },
        fileFilter: (req, file, cb) => {
          // 文件类型检查
          const allowedTypes = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv)$/i
          if (allowedTypes.test(file.originalname)) {
            cb(null, true)
          } else {
            cb(new Error('不支持的文件格式'))
          }
        }
      })
      
      // API路由
      
      // 文件上传
      app.post('/api/upload', upload.single('file'), (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({
              code: -1,
              message: '没有文件被上传',
              data: null
            })
          }
          
          const file = req.file
          const fileType = getFileType(file.mimetype)
          const fileUrl = `/uploads/${fileType}s/${file.filename}`
          
          // 保存文件记录到数据库
          const record = db.add({
            fileName: file.filename,
            originalName: file.originalname,
            fileType,
            fileUrl,
            fileSize: file.size,
            uploadTime: new Date().toISOString(),
            userId: 'local_demo_user',
            platform: 'H5',
            status: 1,
            thumbnail: fileType === 'image' ? fileUrl : undefined
          })
          
          console.log(`✅ 文件上传成功: ${file.originalname} -> ${fileUrl}`)
          
          res.json({
            code: 0,
            message: '上传成功',
            data: record
          })
        } catch (error: any) {
          console.error('❌ 文件上传失败:', error)
          res.status(500).json({
            code: -1,
            message: error.message || '上传失败',
            data: null
          })
        }
      })
      
      // 获取文件列表
      app.get('/api/files', (req, res) => {
        try {
          const { fileType, page, pageSize } = req.query
          
          const result = db.getList({
            userId: 'local_demo_user',
            fileType: fileType as string,
            page: page ? parseInt(page as string) : 1,
            pageSize: pageSize ? parseInt(pageSize as string) : 20
          })
          
          res.json({
            code: 0,
            message: '获取成功',
            data: {
              list: result.list,
              page: page ? parseInt(page as string) : 1,
              pageSize: pageSize ? parseInt(pageSize as string) : 20,
              total: result.total,
              totalPages: Math.ceil(result.total / (pageSize ? parseInt(pageSize as string) : 20))
            }
          })
        } catch (error: any) {
          console.error('❌ 获取文件列表失败:', error)
          res.status(500).json({
            code: -1,
            message: error.message || '获取失败',
            data: {
              list: [],
              total: 0,
              page: 1,
              pageSize: 20
            }
          })
        }
      })
      
      // 删除文件
      app.delete('/api/files/:id', (req, res) => {
        try {
          const { id } = req.params
          
          // 获取文件信息
          const { list } = db.getList({ userId: 'local_demo_user' })
          const file = list.find(f => f.id === id)
          
          if (!file) {
            return res.status(404).json({
              code: -1,
              message: '文件不存在',
              data: false
            })
          }
          
          // 删除物理文件
          const filePath = path.join(process.cwd(), file.fileUrl)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(`🗑️ 删除文件: ${filePath}`)
          }
          
          // 删除数据库记录
          const success = db.delete(id)
          
          if (success) {
            console.log(`✅ 文件删除成功: ${file.fileName}`)
            res.json({
              code: 0,
              message: '删除成功',
              data: true
            })
          } else {
            res.status(500).json({
              code: -1,
              message: '删除失败',
              data: false
            })
          }
        } catch (error: any) {
          console.error('❌ 删除文件失败:', error)
          res.status(500).json({
            code: -1,
            message: error.message || '删除失败',
            data: false
          })
        }
      })
      
      // 静态文件服务
      app.use('/uploads', express.static(UPLOADS_DIR))
      
      // 将Express应用挂载到Vite服务器
      server.middlewares.use(app)
      
      console.log('🚀 文件服务器插件已启动')
      console.log('📁 上传目录:', UPLOADS_DIR)
      console.log('💾 数据目录:', DATA_DIR)
    }
  }
}