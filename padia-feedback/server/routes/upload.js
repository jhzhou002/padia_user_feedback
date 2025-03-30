const express = require('express');
const qiniu = require('qiniu');
const router = express.Router();

// 七牛云配置
const accessKey = 'nfxmZVGEHjkd8Rsn44S-JSynTBUUguTScil9dDvC';
const secretKey = '9lZjiRtRLL0U_MuYkcUZBAL16TlIJ8_dDSbTqqU2';
const bucket = 'padia'; // 存储空间名
const domain = 'https://padia.lingjing235.cn'; // CDN域名

// 获取上传凭证
router.get('/qiniu-token', (req, res) => {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const options = {
    scope: bucket,
    expires: 3600, // 1小时有效期
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
  };
  
  const putPolicy = new qiniu.rs.PutPolicy(options);
  const token = putPolicy.uploadToken(mac);
  
  res.json({
    code: 200,
    data: {
      token: token,
      domain: domain
    },
    message: '获取上传凭证成功'
  });
});

// 导出路由
module.exports = router; 