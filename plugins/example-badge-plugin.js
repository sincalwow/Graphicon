/*
 * Graphicon 示例插件：将此文件复制后修改，即可通过 window.Graphicon 注册自定义工具或滤镜。
 * 仅加载和安装来源可信的插件脚本；插件在浏览器页面上下文中运行。
 */
(() => {
  if (!window.Graphicon?.registerPlugin) {
    console.warn('[Graphicon] 插件宿主未就绪，示例插件未加载。');
    return;
  }

  window.Graphicon.registerPlugin({
    id: 'example.badge-maker',
    name: 'Badge Maker',
    version: '1.0.0',
    setup(api) {
      api.registerTool({
        id: 'add-badge',
        label: '圆形徽章',
        icon: 'fa-certificate',
        run({ fabric, canvas, showToast }) {
          const badge = new fabric.Circle({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
            radius: 92,
            fill: '#1167d8',
            stroke: '#8ec7ff',
            strokeWidth: 8,
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,.22)', blur: 12, offsetX: 0, offsetY: 6 }),
          });
          api.addObject(badge, '示例圆形徽章');
          showToast('示例插件已添加圆形徽章');
        },
      });
    },
  });
})();
