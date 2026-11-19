/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

export interface LanguageOption {
  label: string;
  value:
    | 'en-US'
    | 'zh-CN'
    | 'zh-TW'
    | 'zh-HK'
    | 'ja-JP'
    | 'ko-KR'
    | 'id-ID'
    | 'vi-VN'
    | 'th-TH'
    | 'ms-MY';
}

/**
 * Supported languages
 * 目前只开放：简体中文 / 英文
 *
 * 繁体（台湾/香港）、日语、韩语、印尼、越南、泰、马来等 8 种语言的词条资源仍在
 * 各应用的 locales 目录里（locale lang files + menu-titles/*.json），只是不再出现在
 * 语言切换下拉里。需要重新开放时，取消下面注释即可，无需补数据。
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  {
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    label: 'English',
    value: 'en-US',
  },
  // {
  //   label: '繁體中文（台灣）',
  //   value: 'zh-TW',
  // },
  // {
  //   label: '繁體中文（香港）',
  //   value: 'zh-HK',
  // },
  // {
  //   label: '日本語',
  //   value: 'ja-JP',
  // },
  // {
  //   label: '한국어',
  //   value: 'ko-KR',
  // },
  // {
  //   label: 'Bahasa Indonesia',
  //   value: 'id-ID',
  // },
  // {
  //   label: 'Tiếng Việt',
  //   value: 'vi-VN',
  // },
  // {
  //   label: 'ภาษาไทย',
  //   value: 'th-TH',
  // },
  // {
  //   label: 'Bahasa Melayu',
  //   value: 'ms-MY',
  // },
];
