const request = require("request");
const cheerio = require('cheerio');
const zlib = require('zlib');
const fs = require("fs");
const iconv = require('iconv-lite');  

// 添加主题
class ThemeOperation {
    constructor() {
        this.themeHost = 'http://desk.zol.com.cn';
        this.themePage = 1;
        this.themeUrl = `${this.themeHost}/pc/${this.themePage}.html`;
        this.themeList = []; // 主题列表
    }
    // 添加主题信息
    async addThemeList() {
        const that = this;
        return new Promise((resolve, reject) => {
            console.log('爬取主题网页', this.themeUrl)
            containerFunc();
            function containerFunc() {
                const req = request.get({
                    url: that.themeUrl,
                    timeout: 20000,
                    encoding: null, // 此处要显式为null，不然内部会默认进行toString，toString参数没有的情况下，默认格式为utf8
                }, (error, response, body) => {
                    if (error) {
                        console.log('抓取主题网页错误');
                        reject(error);
                        return null;
                    }
                    const doc = iconv.decode(body, 'gb2312').toString();
                    const $ = cheerio.load(doc);
                    let picList2 = $('.pic-list2');
                    let pageLastClassName = $('.page').children().last().attr('class');
                    let currentData = {}; // 当前数据
                    picList2.find('li').each(function() {
                        let picDom = $(this).find('.pic')
                        let imgUrl = picDom.attr('href');
                        let title = picDom.find('img').attr('title');
                        let time = $(this).find('ins').text();
                        currentData = {
                            imgUrl: that.themeHost + imgUrl,
                            title,
                            time,
                        };
                    });
                    that.themeList.push(currentData);
                    console.log('页码', that.themePage, pageLastClassName)
                    // 如果当前class选中状态与当前爬取页数不相等则代表不是最后一页
                    if (pageLastClassName !== 'active') {
                        that.themePage += 1;
                        that.themeUrl = `${that.themeHost}/pc/${that.themePage}.html`;
                        containerFunc();
                    } else {
                        console.log('壁纸主题没有数据了,此为最后一条：', JSON.stringify(currentData));
                        // 爬取图片结束
                        fs.writeFileSync('./theme.json', JSON.stringify(that.themeList));
                        resolve();
                    }
                });
            }
            
        });
    }
    // 获取主题对应的图片资源页面
    /** 
     * data 当前主题对象
     * succeedCall 图片地址获取成功的回调
    */
    async addThemeSubImg(data, succeedCall) {
        return new Promise((resolve, reject) => {
            const req = request.get({
                url: data.imgUrl,
                encoding: null, // 此处要显式为null，不然内部会默认进行toString，toString参数没有的情况下，默认格式为utf8
            }, async (error, response, body) => {
                if (error) {
                    console.log('抓取主题图片错误');
                    reject(error);
                }
                const doc = iconv.decode(body, 'gb2312').toString();
                try {
                    // 获取图片list变量
                    let imgList = JSON.parse(
                        doc.match('var deskPicArr 		= (.*?);')[0].replace(/(var deskPicArr 		=)|(;)/g,'')
                    ).list;
                    for (let i = 0; i < imgList.length; i ++) {
                        let item = imgList[i];

                        let picId = item.picId; // 图片标识
                        let oriSize = item.oriSize; // 最大尺寸
                        let imgPgeUrl = `/showpic/${oriSize}_${picId}_102.html`;
                        try {
                            let staticImgSrc = await this.getImgPageHighLinkStatic(imgPgeUrl);
                            data.imgUrl = staticImgSrc;
                            succeedCall(data);
                        } catch(e) {
                            console.log(e);
                        }
                        if (i === imgList.length - 1) {
                            resolve();
                        }
                    }
                    
                    resolve();
                } catch(e) {
                    console.log('error：get img static path - ', e);
                }

            });
        });
    }
    // 获取高清图片url地址里的静态文件路径
    /** 
     * url 当前主题对象
    */
   async getImgPageHighLinkStatic(url) {
    return new Promise((resolve, reject) => {
        const req = request.get({
            url: this.themeHost + url,
            encoding: null, // 此处要显式为null，不然内部会默认进行toString，toString参数没有的情况下，默认格式为utf8
        }, (error, response, body) => {
            if (error) {
                console.log('获取获取高清图片url地址里的静态文件路径错误', body);
                reject(error);
            }
            console.log('爬取的图片资源地址:', this.themeHost + url)
            const doc = iconv.decode(body, 'gb2312').toString();
            const $ = cheerio.load(doc);
            let src = $('img').attr('src');
            resolve(src);
        });
    });
   }
}
module.exports = ThemeOperation;