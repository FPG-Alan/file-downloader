let transfer = new window['savvy-transfer']();
transfer
  .addFiles(
    [
      {
        path: 'http://localhost:9798/space/creatives/1/31_203_youtube-360.mp4',
        name: '31_203_youtube-360.mp4'
      },
      {
        path: 'http://localhost:9798/space/creatives/1/31_202_hello-test_ppp.mp4',
        name: '31_202_hello-test_ppp.mp4'
      } /*,
      {
        path: 'http://localhost:9798/space/creatives/1/adCreateAndDelete.mp4',
        name: 'adCreateAndDelete.mp4'
      },
      {
        path: 'http://localhost:9798/space/creatives/1/bindAndUnbindAccount.mp4',
        name: 'bindAndUnbindAccount.mp4'
      },
      {
        path: 'http://localhost:9798/space/creatives/1/[细说PHP].高洛峰.文字版.pdf',
        name: '[细说PHP].高洛峰.文字版.pdf'
      } */
    ],
    false
  )
  .then(function onfulfilled(zipFile) {
    console.log('file all ready');
    console.log(zipFile);

    transfer.scheduleDownload();
  });
// transfer.scheduleDownload();
