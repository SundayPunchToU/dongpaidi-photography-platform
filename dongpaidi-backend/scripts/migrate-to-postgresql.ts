import { PrismaClient as SqlitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * SQLite到PostgreSQL数据迁移脚本
 */

// SQLite数据库连接
const sqliteClient = new SqlitePrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

// PostgreSQL数据库连接
const postgresClient = new PostgresPrismaClient();

async function migrateData() {
  console.log('🚀 开始数据迁移：SQLite -> PostgreSQL');

  try {
    // 1. 检查SQLite数据库是否存在
    const sqliteDbPath = path.join(process.cwd(), 'dev.db');
    if (!fs.existsSync(sqliteDbPath)) {
      console.log('⚠️  SQLite数据库不存在，跳过数据迁移');
      return;
    }

    // 2. 连接数据库
    await sqliteClient.$connect();
    await postgresClient.$connect();
    console.log('✅ 数据库连接成功');

    // 3. 迁移用户数据
    console.log('📦 迁移用户数据...');
    const users = await sqliteClient.user.findMany();
    
    for (const user of users) {
      try {
        // 处理JSON字段
        const userData = {
          ...user,
          specialties: typeof user.specialties === 'string' 
            ? JSON.parse(user.specialties) 
            : user.specialties,
          equipment: typeof user.equipment === 'string' 
            ? JSON.parse(user.equipment) 
            : user.equipment,
          portfolioImages: typeof user.portfolioImages === 'string' 
            ? JSON.parse(user.portfolioImages) 
            : user.portfolioImages,
        };

        await postgresClient.user.upsert({
          where: { id: user.id },
          update: userData,
          create: userData,
        });
        
        console.log(`  ✅ 用户迁移成功: ${user.nickname}`);
      } catch (error) {
        console.error(`  ❌ 用户迁移失败: ${user.nickname}`, error);
      }
    }

    // 4. 迁移作品数据
    console.log('📦 迁移作品数据...');
    const works = await sqliteClient.work.findMany();
    
    for (const work of works) {
      try {
        // 处理JSON字段
        const workData = {
          ...work,
          images: typeof work.images === 'string' 
            ? JSON.parse(work.images) 
            : work.images,
          tags: typeof work.tags === 'string' 
            ? JSON.parse(work.tags) 
            : work.tags,
          shootingInfo: typeof work.shootingInfo === 'string' 
            ? JSON.parse(work.shootingInfo) 
            : work.shootingInfo,
        };

        await postgresClient.work.upsert({
          where: { id: work.id },
          update: workData,
          create: workData,
        });
        
        console.log(`  ✅ 作品迁移成功: ${work.title}`);
      } catch (error) {
        console.error(`  ❌ 作品迁移失败: ${work.title}`, error);
      }
    }

    // 5. 迁移其他数据表
    const tables = ['appointment', 'comment', 'like', 'collection', 'follow', 'message'];
    
    for (const tableName of tables) {
      try {
        console.log(`📦 迁移${tableName}数据...`);
        const records = await (sqliteClient as any)[tableName].findMany();
        
        for (const record of records) {
          try {
            // 处理可能的JSON字段
            const recordData = { ...record };
            if (tableName === 'appointment' && record.requirements) {
              recordData.requirements = typeof record.requirements === 'string' 
                ? JSON.parse(record.requirements) 
                : record.requirements;
            }

            await (postgresClient as any)[tableName].upsert({
              where: { id: record.id },
              update: recordData,
              create: recordData,
            });
          } catch (error) {
            console.error(`  ❌ ${tableName}记录迁移失败:`, error);
          }
        }
        
        console.log(`  ✅ ${tableName}数据迁移完成，共${records.length}条记录`);
      } catch (error) {
        console.log(`  ⚠️  ${tableName}表不存在或为空，跳过迁移`);
      }
    }

    // 6. 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const postgresUserCount = await postgresClient.user.count();
    const postgresWorkCount = await postgresClient.work.count();
    
    console.log(`✅ PostgreSQL数据统计:`);
    console.log(`  - 用户数量: ${postgresUserCount}`);
    console.log(`  - 作品数量: ${postgresWorkCount}`);

    console.log('🎉 数据迁移完成！');

  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// 备份SQLite数据库
async function backupSqliteDatabase() {
  const sqliteDbPath = path.join(process.cwd(), 'dev.db');
  const backupPath = path.join(process.cwd(), `dev.db.backup.${Date.now()}`);
  
  if (fs.existsSync(sqliteDbPath)) {
    fs.copyFileSync(sqliteDbPath, backupPath);
    console.log(`✅ SQLite数据库已备份到: ${backupPath}`);
  }
}

// 主函数
async function main() {
  try {
    await backupSqliteDatabase();
    await migrateData();
  } catch (error) {
    console.error('❌ 迁移过程失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { migrateData, backupSqliteDatabase };
