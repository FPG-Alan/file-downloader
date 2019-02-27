let transfer = new window['savvy-transfer']();
transfer.addFiles([
  {
    path: 'http://localhost:9798/space/creatives/1/31_203_youtube-360.mp4',
    name: '31_203_youtube-360.mp4'
  },
  {
    path: 'http://localhost:9798/space/creatives/1/31_202_hello-test_ppp.mp4',
    name: '31_202_hello-test_ppp.mp4'
  }
]);
transfer.scheduleDownload();
