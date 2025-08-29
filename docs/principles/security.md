# 安全机制（Security Mechanisms）

PDF安全机制提供了文档保护功能，包括访问控制、内容加密和数字签名。这些机制确保文档的机密性、完整性和真实性，防止未授权访问和篡改。

## 加密系统

### 加密字典结构

```pdf
% 加密字典
<<
/Filter /Standard          % 安全处理器
/V 4                       % 算法版本
/Length 128                % 密钥长度（位）
/R 4                       % 修订版本
/O <28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A>
/U <28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A>
/P -44                     % 权限标志
/EncryptMetadata true      % 加密元数据
/CF <<                     % 加密过滤器字典
  /StdCF <<
    /Type /CryptFilter
    /CFM /AESV2            % 加密方法
    /AuthEvent /DocOpen    % 认证事件
    /Length 16             % 密钥长度（字节）
  >>
>>
/StmF /StdCF              % 流过滤器
/StrF /StdCF              % 字符串过滤器
/EFF /StdCF               % 嵌入文件过滤器
>>
```

### 标准安全处理器

#### 算法版本对应关系

| 版本(V) | 修订(R) | 密钥长度 | 加密算法 | 支持功能 |
|---------|---------|----------|----------|----------|
| 1 | 2 | 40位 | RC4 | 基本加密 |
| 2 | 3 | 40位 | RC4 | 扩展权限 |
| 4 | 4 | 128位 | RC4/AES | 元数据加密 |
| 5 | 5/6 | 256位 | AES | 现代加密 |

#### 密钥生成算法

```javascript
/**
 * PDF加密密钥生成器
 */
class PDFEncryptionKeyGenerator {
  /**
   * 生成文件加密密钥（算法3.2）
   * @param {string} password - 用户密码
   * @param {Uint8Array} o - O值
   * @param {number} p - P值
   * @param {Uint8Array} fileId - 文件ID
   * @param {number} keyLength - 密钥长度
   * @param {number} revision - 修订版本
   * @returns {Uint8Array} 加密密钥
   */
  generateFileKey(password, o, p, fileId, keyLength, revision) {
    // 1. 填充密码到32字节
    const paddedPassword = this.padPassword(password);
    
    // 2. 创建MD5输入
    const md5Input = new Uint8Array(paddedPassword.length + o.length + 4 + fileId.length);
    let offset = 0;
    
    md5Input.set(paddedPassword, offset);
    offset += paddedPassword.length;
    
    md5Input.set(o, offset);
    offset += o.length;
    
    // P值（小端序）
    md5Input[offset++] = p & 0xFF;
    md5Input[offset++] = (p >> 8) & 0xFF;
    md5Input[offset++] = (p >> 16) & 0xFF;
    md5Input[offset++] = (p >> 24) & 0xFF;
    
    md5Input.set(fileId, offset);
    
    // 3. 计算MD5哈希
    let hash = this.md5(md5Input);
    
    // 4. 对于修订版本3及以上，进行50次迭代
    if (revision >= 3) {
      for (let i = 0; i < 50; i++) {
        hash = this.md5(hash.slice(0, keyLength));
      }
    }
    
    return hash.slice(0, keyLength);
  }
  
  /**
   * 填充密码到32字节
   * @param {string} password - 原始密码
   * @returns {Uint8Array} 填充后的密码
   */
  padPassword(password) {
    const padding = new Uint8Array([
      0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
      0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
      0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
      0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
    ]);
    
    const result = new Uint8Array(32);
    const passwordBytes = new TextEncoder().encode(password);
    
    if (passwordBytes.length >= 32) {
      result.set(passwordBytes.slice(0, 32));
    } else {
      result.set(passwordBytes);
      result.set(padding.slice(0, 32 - passwordBytes.length), passwordBytes.length);
    }
    
    return result;
  }
}
```

### AES加密实现

```javascript
/**
 * PDF AES加密处理器
 */
class PDFAESEncryption {
  /**
   * 加密数据流
   * @param {Uint8Array} data - 原始数据
   * @param {Uint8Array} key - 加密密钥
   * @param {number} objNum - 对象编号
   * @param {number} genNum - 生成编号
   * @returns {Uint8Array} 加密后的数据
   */
  encryptStream(data, key, objNum, genNum) {
    // 1. 生成对象密钥
    const objectKey = this.generateObjectKey(key, objNum, genNum);
    
    // 2. 生成随机IV
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    // 3. AES-CBC加密
    const encrypted = this.aesEncrypt(data, objectKey, iv);
    
    // 4. 组合IV和加密数据
    const result = new Uint8Array(iv.length + encrypted.length);
    result.set(iv);
    result.set(encrypted, iv.length);
    
    return result;
  }
  
  /**
   * 解密数据流
   * @param {Uint8Array} encryptedData - 加密数据
   * @param {Uint8Array} key - 解密密钥
   * @param {number} objNum - 对象编号
   * @param {number} genNum - 生成编号
   * @returns {Uint8Array} 解密后的数据
   */
  decryptStream(encryptedData, key, objNum, genNum) {
    // 1. 生成对象密钥
    const objectKey = this.generateObjectKey(key, objNum, genNum);
    
    // 2. 提取IV和加密数据
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    // 3. AES-CBC解密
    return this.aesDecrypt(encrypted, objectKey, iv);
  }
  
  /**
   * 生成对象特定密钥
   * @param {Uint8Array} fileKey - 文件密钥
   * @param {number} objNum - 对象编号
   * @param {number} genNum - 生成编号
   * @returns {Uint8Array} 对象密钥
   */
  generateObjectKey(fileKey, objNum, genNum) {
    const input = new Uint8Array(fileKey.length + 5);
    input.set(fileKey);
    
    // 添加对象编号和生成编号（小端序）
    let offset = fileKey.length;
    input[offset++] = objNum & 0xFF;
    input[offset++] = (objNum >> 8) & 0xFF;
    input[offset++] = (objNum >> 16) & 0xFF;
    input[offset++] = genNum & 0xFF;
    input[offset++] = (genNum >> 8) & 0xFF;
    
    const hash = this.md5(input);
    return hash.slice(0, Math.min(16, fileKey.length + 5));
  }
}
```

## 权限控制

### 权限标志

```javascript
/**
 * PDF权限标志
 */
const PDFPermissions = {
  // 位3：打印文档
  PRINT: 1 << 2,
  
  // 位4：修改文档内容
  MODIFY: 1 << 3,
  
  // 位5：复制或提取文本和图形
  COPY: 1 << 4,
  
  // 位6：添加或修改注释和表单字段
  MODIFY_ANNOTATIONS: 1 << 5,
  
  // 位9：填写表单字段
  FILL_FORMS: 1 << 8,
  
  // 位10：提取文本和图形（辅助功能）
  EXTRACT_ACCESSIBILITY: 1 << 9,
  
  // 位11：组装文档（插入、旋转、删除页面）
  ASSEMBLE: 1 << 10,
  
  // 位12：高质量打印
  PRINT_HIGH_QUALITY: 1 << 11
};

/**
 * 权限检查器
 */
class PermissionChecker {
  /**
   * 检查权限
   * @param {number} permissions - 权限值
   * @param {number} permission - 要检查的权限
   * @returns {boolean} 是否有权限
   */
  hasPermission(permissions, permission) {
    return (permissions & permission) !== 0;
  }
  
  /**
   * 获取权限描述
   * @param {number} permissions - 权限值
   * @returns {Array<string>} 权限描述数组
   */
  getPermissionDescriptions(permissions) {
    const descriptions = [];
    
    if (this.hasPermission(permissions, PDFPermissions.PRINT)) {
      descriptions.push('打印文档');
    }
    if (this.hasPermission(permissions, PDFPermissions.MODIFY)) {
      descriptions.push('修改内容');
    }
    if (this.hasPermission(permissions, PDFPermissions.COPY)) {
      descriptions.push('复制内容');
    }
    if (this.hasPermission(permissions, PDFPermissions.MODIFY_ANNOTATIONS)) {
      descriptions.push('修改注释');
    }
    if (this.hasPermission(permissions, PDFPermissions.FILL_FORMS)) {
      descriptions.push('填写表单');
    }
    if (this.hasPermission(permissions, PDFPermissions.EXTRACT_ACCESSIBILITY)) {
      descriptions.push('辅助功能访问');
    }
    if (this.hasPermission(permissions, PDFPermissions.ASSEMBLE)) {
      descriptions.push('组装文档');
    }
    if (this.hasPermission(permissions, PDFPermissions.PRINT_HIGH_QUALITY)) {
      descriptions.push('高质量打印');
    }
    
    return descriptions;
  }
}
```

## 数字签名

### 签名字典结构

```pdf
% 签名字典
<<
/Type /Sig
/Filter /Adobe.PPKLite     % 签名过滤器
/SubFilter /adbe.pkcs7.detached % 子过滤器
/Contents <3082...>         % 签名内容（PKCS#7）
/ByteRange [0 1234 5678 9012] % 签名字节范围
/M (D:20240101120000+08'00') % 签名时间
/Name (张三)                % 签名者姓名
/Reason (文档审批)          % 签名原因
/Location (北京)            % 签名地点
/ContactInfo (zhang@example.com) % 联系信息
/Reference [<<              % 引用字典
  /Type /SigRef
  /TransformMethod /DocMDP  % 变换方法
  /TransformParams <<
    /Type /TransformParams
    /P 2                    % 权限级别
    /V /1.2
  >>
>>]
/Prop_Build <<              % 构建属性
  /Filter <<
    /Name /Adobe.PPKLite
    /R 0x2001F
    /Date (D:20240101120000+08'00')
  >>
  /App <<
    /Name /Acrobat
    /TrustedMode true
    /OS [/Win]
    /REx 202400101
  >>
>>
>>
```

### 签名验证

```javascript
/**
 * PDF数字签名验证器
 */
class PDFSignatureVerifier {
  /**
   * 验证数字签名
   * @param {Object} signature - 签名字典
   * @param {Uint8Array} pdfData - PDF文件数据
   * @returns {Object} 验证结果
   */
  async verifySignature(signature, pdfData) {
    try {
      // 1. 提取签名数据
      const signatureData = this.extractSignatureData(signature);
      
      // 2. 计算文档哈希
      const documentHash = await this.calculateDocumentHash(
        pdfData, 
        signature.ByteRange
      );
      
      // 3. 验证PKCS#7签名
      const pkcs7Result = await this.verifyPKCS7Signature(
        signatureData, 
        documentHash
      );
      
      // 4. 验证证书链
      const certificateResult = await this.verifyCertificateChain(
        pkcs7Result.certificates
      );
      
      // 5. 检查文档完整性
      const integrityResult = this.checkDocumentIntegrity(
        pdfData, 
        signature
      );
      
      return {
        isValid: pkcs7Result.isValid && certificateResult.isValid && integrityResult.isValid,
        signatureValid: pkcs7Result.isValid,
        certificateValid: certificateResult.isValid,
        documentIntact: integrityResult.isValid,
        signerInfo: pkcs7Result.signerInfo,
        certificateInfo: certificateResult.certificateInfo,
        signatureTime: signature.M,
        reason: signature.Reason,
        location: signature.Location,
        errors: [
          ...pkcs7Result.errors,
          ...certificateResult.errors,
          ...integrityResult.errors
        ]
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }
  
  /**
   * 计算文档哈希
   * @param {Uint8Array} pdfData - PDF数据
   * @param {Array<number>} byteRange - 字节范围
   * @returns {Promise<Uint8Array>} 文档哈希
   */
  async calculateDocumentHash(pdfData, byteRange) {
    const [start1, length1, start2, length2] = byteRange;
    
    // 提取签名范围外的数据
    const data1 = pdfData.slice(start1, start1 + length1);
    const data2 = pdfData.slice(start2, start2 + length2);
    
    // 合并数据
    const combinedData = new Uint8Array(data1.length + data2.length);
    combinedData.set(data1);
    combinedData.set(data2, data1.length);
    
    // 计算SHA-256哈希
    return await crypto.subtle.digest('SHA-256', combinedData);
  }
  
  /**
   * 验证PKCS#7签名
   * @param {Uint8Array} signatureData - 签名数据
   * @param {Uint8Array} documentHash - 文档哈希
   * @returns {Promise<Object>} 验证结果
   */
  async verifyPKCS7Signature(signatureData, documentHash) {
    // PKCS#7签名验证实现
    // 这里需要使用专门的PKCS#7库
    const pkcs7 = this.parsePKCS7(signatureData);
    
    return {
      isValid: true, // 实际验证结果
      signerInfo: {
        commonName: pkcs7.signerCertificate.subject.commonName,
        organization: pkcs7.signerCertificate.subject.organization,
        email: pkcs7.signerCertificate.subject.email
      },
      certificates: pkcs7.certificates,
      errors: []
    };
  }
}
```

### 签名创建

```javascript
/**
 * PDF数字签名创建器
 */
class PDFSignatureCreator {
  /**
   * 创建数字签名
   * @param {Uint8Array} pdfData - PDF数据
   * @param {Object} certificate - 签名证书
   * @param {Object} privateKey - 私钥
   * @param {Object} options - 签名选项
   * @returns {Promise<Uint8Array>} 签名后的PDF数据
   */
  async createSignature(pdfData, certificate, privateKey, options = {}) {
    // 1. 创建签名字段
    const signatureField = this.createSignatureField(options);
    
    // 2. 在PDF中插入签名字段
    const modifiedPDF = this.insertSignatureField(pdfData, signatureField);
    
    // 3. 计算签名范围
    const byteRange = this.calculateByteRange(modifiedPDF);
    
    // 4. 计算文档哈希
    const documentHash = await this.calculateDocumentHash(modifiedPDF, byteRange);
    
    // 5. 创建PKCS#7签名
    const pkcs7Signature = await this.createPKCS7Signature(
      documentHash,
      certificate,
      privateKey,
      options
    );
    
    // 6. 插入签名数据
    return this.insertSignatureData(modifiedPDF, pkcs7Signature, byteRange);
  }
  
  /**
   * 创建签名字段
   * @param {Object} options - 签名选项
   * @returns {Object} 签名字段对象
   */
  createSignatureField(options) {
    const now = new Date();
    const dateString = this.formatPDFDate(now);
    
    return {
      Type: '/Annot',
      Subtype: '/Widget',
      FT: '/Sig',
      T: options.fieldName || 'Signature1',
      Rect: options.rect || [100, 100, 300, 150],
      P: options.pageRef,
      V: {
        Type: '/Sig',
        Filter: '/Adobe.PPKLite',
        SubFilter: '/adbe.pkcs7.detached',
        M: dateString,
        Name: options.signerName || '',
        Reason: options.reason || '',
        Location: options.location || '',
        ContactInfo: options.contactInfo || '',
        ByteRange: [0, 0, 0, 0], // 占位符
        Contents: new Uint8Array(8192) // 签名数据占位符
      }
    };
  }
  
  /**
   * 创建PKCS#7签名
   * @param {Uint8Array} documentHash - 文档哈希
   * @param {Object} certificate - 证书
   * @param {Object} privateKey - 私钥
   * @param {Object} options - 选项
   * @returns {Promise<Uint8Array>} PKCS#7签名数据
   */
  async createPKCS7Signature(documentHash, certificate, privateKey, options) {
    // 使用Web Crypto API或专门的PKCS#7库创建签名
    const signature = await crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      privateKey,
      documentHash
    );
    
    // 构建PKCS#7结构
    return this.buildPKCS7Structure(signature, certificate, options);
  }
}
```

## 时间戳服务

### RFC 3161时间戳

```javascript
/**
 * RFC 3161时间戳服务客户端
 */
class TimestampService {
  constructor(tsaUrl) {
    this.tsaUrl = tsaUrl;
  }
  
  /**
   * 获取时间戳
   * @param {Uint8Array} messageImprint - 消息摘要
   * @param {string} hashAlgorithm - 哈希算法
   * @returns {Promise<Uint8Array>} 时间戳令牌
   */
  async getTimestamp(messageImprint, hashAlgorithm = 'SHA-256') {
    // 1. 创建时间戳请求
    const tsRequest = this.createTimestampRequest(messageImprint, hashAlgorithm);
    
    // 2. 发送请求到TSA
    const response = await fetch(this.tsaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
        'Content-Length': tsRequest.length.toString()
      },
      body: tsRequest
    });
    
    if (!response.ok) {
      throw new Error(`Timestamp request failed: ${response.status}`);
    }
    
    // 3. 解析时间戳响应
    const tsResponse = new Uint8Array(await response.arrayBuffer());
    return this.parseTimestampResponse(tsResponse);
  }
  
  /**
   * 创建时间戳请求
   * @param {Uint8Array} messageImprint - 消息摘要
   * @param {string} hashAlgorithm - 哈希算法
   * @returns {Uint8Array} ASN.1编码的时间戳请求
   */
  createTimestampRequest(messageImprint, hashAlgorithm) {
    // ASN.1 DER编码的时间戳请求结构
    // 这里需要使用ASN.1编码库
    return new Uint8Array(); // 占位符
  }
  
  /**
   * 解析时间戳响应
   * @param {Uint8Array} tsResponse - 时间戳响应
   * @returns {Uint8Array} 时间戳令牌
   */
  parseTimestampResponse(tsResponse) {
    // 解析ASN.1 DER编码的时间戳响应
    // 提取时间戳令牌
    return new Uint8Array(); // 占位符
  }
}
```

## 长期验证（LTV）

### 文档安全存储（DSS）

```pdf
% DSS字典
<<
/Type /DSS
/Certs [                   % 证书存储
  <<
    /Type /CertificateStore
    /Certs [15 0 R 16 0 R 17 0 R]
  >>
]
/OCSPs [                   % OCSP响应存储
  <<
    /Type /OCSPResponse
    /OCSPs [18 0 R 19 0 R]
  >>
]
/CRLs [                    % CRL存储
  <<
    /Type /CRLStore
    /CRLs [20 0 R 21 0 R]
  >>
]
/VRI <<                    % 验证相关信息
  /Sig1 <<
    /Type /VRI
    /Cert [15 0 R]
    /OCSP [18 0 R]
    /CRL [20 0 R]
    /TS 22 0 R             % 时间戳
  >>
>>
>>
```

### LTV启用处理

```javascript
/**
 * LTV（长期验证）处理器
 */
class LTVProcessor {
  /**
   * 启用LTV
   * @param {Uint8Array} pdfData - PDF数据
   * @param {Array} signatures - 签名数组
   * @returns {Promise<Uint8Array>} 启用LTV的PDF数据
   */
  async enableLTV(pdfData, signatures) {
    const validationData = {
      certificates: new Set(),
      ocsps: new Set(),
      crls: new Set(),
      timestamps: new Set()
    };
    
    // 1. 收集所有签名的验证数据
    for (const signature of signatures) {
      const sigValidationData = await this.collectValidationData(signature);
      this.mergeValidationData(validationData, sigValidationData);
    }
    
    // 2. 创建DSS字典
    const dss = this.createDSS(validationData);
    
    // 3. 将DSS添加到PDF
    return this.addDSSToPDF(pdfData, dss);
  }
  
  /**
   * 收集签名验证数据
   * @param {Object} signature - 签名对象
   * @returns {Promise<Object>} 验证数据
   */
  async collectValidationData(signature) {
    const validationData = {
      certificates: [],
      ocsps: [],
      crls: [],
      timestamps: []
    };
    
    // 提取证书链
    const certificates = this.extractCertificateChain(signature);
    validationData.certificates = certificates;
    
    // 获取OCSP响应
    for (const cert of certificates) {
      try {
        const ocspResponse = await this.getOCSPResponse(cert);
        if (ocspResponse) {
          validationData.ocsps.push(ocspResponse);
        }
      } catch (error) {
        console.warn('Failed to get OCSP response:', error);
      }
    }
    
    // 获取CRL
    for (const cert of certificates) {
      try {
        const crl = await this.getCRL(cert);
        if (crl) {
          validationData.crls.push(crl);
        }
      } catch (error) {
        console.warn('Failed to get CRL:', error);
      }
    }
    
    // 获取时间戳
    if (signature.timeStamp) {
      validationData.timestamps.push(signature.timeStamp);
    }
    
    return validationData;
  }
}
```

## 安全最佳实践

### 密码策略

```javascript
/**
 * 密码强度检查器
 */
class PasswordStrengthChecker {
  /**
   * 检查密码强度
   * @param {string} password - 密码
   * @returns {Object} 强度评估结果
   */
  checkStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommon: !this.isCommonPassword(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      strength: this.getStrengthLevel(score),
      checks,
      suggestions: this.getSuggestions(checks)
    };
  }
  
  /**
   * 获取强度等级
   * @param {number} score - 得分
   * @returns {string} 强度等级
   */
  getStrengthLevel(score) {
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  }
  
  /**
   * 检查是否为常见密码
   * @param {string} password - 密码
   * @returns {boolean} 是否为常见密码
   */
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      '12345678', '123456789', 'password1', 'abc123', '111111'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }
}
```

### 证书验证

```javascript
/**
 * 证书验证器
 */
class CertificateValidator {
  /**
   * 验证证书链
   * @param {Array} certificateChain - 证书链
   * @param {Array} trustedRoots - 受信任根证书
   * @returns {Promise<Object>} 验证结果
   */
  async validateCertificateChain(certificateChain, trustedRoots) {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // 1. 检查证书链完整性
    if (!this.isChainComplete(certificateChain)) {
      results.errors.push('证书链不完整');
      results.isValid = false;
    }
    
    // 2. 验证每个证书
    for (let i = 0; i < certificateChain.length; i++) {
      const cert = certificateChain[i];
      const issuer = i < certificateChain.length - 1 ? 
        certificateChain[i + 1] : this.findTrustedRoot(cert, trustedRoots);
      
      if (!issuer) {
        results.errors.push(`无法找到证书 ${i} 的颁发者`);
        results.isValid = false;
        continue;
      }
      
      // 验证签名
      if (!await this.verifyCertificateSignature(cert, issuer)) {
        results.errors.push(`证书 ${i} 签名验证失败`);
        results.isValid = false;
      }
      
      // 检查有效期
      if (!this.isCertificateValid(cert)) {
        results.errors.push(`证书 ${i} 已过期或尚未生效`);
        results.isValid = false;
      }
      
      // 检查撤销状态
      const revocationStatus = await this.checkRevocationStatus(cert);
      if (revocationStatus.isRevoked) {
        results.errors.push(`证书 ${i} 已被撤销`);
        results.isValid = false;
      }
    }
    
    return results;
  }
  
  /**
   * 检查证书撤销状态
   * @param {Object} certificate - 证书
   * @returns {Promise<Object>} 撤销状态
   */
  async checkRevocationStatus(certificate) {
    // 1. 尝试OCSP检查
    try {
      const ocspResult = await this.checkOCSP(certificate);
      if (ocspResult.status === 'good') {
        return { isRevoked: false, method: 'OCSP' };
      } else if (ocspResult.status === 'revoked') {
        return { 
          isRevoked: true, 
          method: 'OCSP',
          revocationTime: ocspResult.revocationTime,
          reason: ocspResult.reason
        };
      }
    } catch (error) {
      console.warn('OCSP check failed:', error);
    }
    
    // 2. 回退到CRL检查
    try {
      const crlResult = await this.checkCRL(certificate);
      return {
        isRevoked: crlResult.isRevoked,
        method: 'CRL',
        revocationTime: crlResult.revocationTime,
        reason: crlResult.reason
      };
    } catch (error) {
      console.warn('CRL check failed:', error);
      return { isRevoked: false, method: 'none', error: error.message };
    }
  }
}
```

## 性能优化

### 加密性能优化

1. **硬件加速**：利用Web Crypto API的硬件加速
2. **批量处理**：批量加密/解密多个对象
3. **缓存机制**：缓存计算结果和密钥
4. **异步处理**：使用Web Workers进行密集计算

### 验证性能优化

1. **并行验证**：并行验证多个签名
2. **缓存验证结果**：缓存证书和撤销状态检查结果
3. **增量验证**：只验证变更的部分
4. **延迟验证**：按需验证签名

PDF安全机制为文档提供了全面的保护功能，理解其实现原理对于开发安全的PDF应用至关重要。正确实施这些安全机制可以确保文档的机密性、完整性和真实性。