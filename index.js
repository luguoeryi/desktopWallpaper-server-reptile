
const fs = require("fs");

const ThemeOperation = require('./themeOperation');
const database = require('./db');

class main {
    constructor() {
        this.themeOperation = new ThemeOperation(); // 爬虫主题操作对象
        this.init();
    }
    async init() {
        try {
            await this.themeOperation.addThemeList();
        } catch(e) {
            console.log('主题爬取发生错误:', e)
        }
        console.log('进行下一步-----', this.themeOperation.themeList);
        // let themeList = JSON.parse(fs.readFileSync('./theme.json'));
        let themeList = this.themeOperation.themeList;
        try {
            for(let item of themeList) {
                let wallpapeThemeId = await this.insetSqThemeList(item);
                item.wallpapeThemeId = wallpapeThemeId;
                await this.themeOperation.addThemeSubImg(item, async (data) => {
                    await this.insetSqThemeImgList(data);
                });
            }
        } catch(e) {
            console.log('error：Data insert db-', e)
        }
        database.end();
        console.log('爬取程序完成!');
    }
    // 将主题数据写入数据库
    insetSqThemeList(data) {
        return new Promise((resolve, reject) => {
            database.query(`INSERT INTO wallpaper.wallpape_theme (img_url, title) VALUES ('${
                data.imgUrl}', '${data.title}')`, function (error, results, fields) {
                if (error) {
                    return reject(error);
                }
                let resultsData = results;
                console.log('主题信息插入db成功----', resultsData.insertId);
                resolve(resultsData.insertId);
              });
        })
    }
    // 将主题下图片数据写入数据库
    insetSqThemeImgList(data) {
        return new Promise((resolve, reject) => {
            database.query(`INSERT INTO wallpaper.wallpape_img (wallpape_theme_id, img_url, title) VALUES (${
                data.wallpapeThemeId},'${data.imgUrl}', '${data.title}')`, function (error, results, fields) {
                    if (error) {
                        return reject(error);
                    }
                    let resultsData = results;
                    console.log('图片信息插入db成功----', resultsData.insertId);
                    resolve(resultsData.insertId);
                });
        })

    }
}

new main();



