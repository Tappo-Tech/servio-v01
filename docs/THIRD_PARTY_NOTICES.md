# إشعارات المكونات الخارجية

## QZ Tray JavaScript client

- الحزمة: `qz-tray`، الإصدار `2.3.0`.
- الاستخدام: طبقة اتصال المتصفح بخدمة QZ Tray المحلية لاكتشاف الطابعات وإرسال HTML للطباعة.
- المصدر: [npm package](https://www.npmjs.com/package/qz-tray) و[وثائق QZ Tray](https://qz.io/docs/getting-started).
- الرخصة: GNU Lesser General Public License 2.1 (LGPL-2.1). نسخة الرخصة الكاملة في [QZ_TRAY_LGPL-2.1.txt](./licenses/QZ_TRAY_LGPL-2.1.txt).
- يُنسخ ملف الحزمة الرسمي، دون تعديل، إلى `public/qz-tray.js` عند `npm start` أو `npm run build` بواسطة `scripts/copy-qz-tray.js`، ثم يُحمّل من نفس النطاق عند فتح إعداد الطابعة أو الطباعة. لا تُضمّن المكتبة في حزمة JavaScript الأولية لزوار المنيو.
