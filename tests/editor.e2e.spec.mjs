import { test, expect } from '@playwright/test';

async function appReady(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.Graphicon && document.querySelector('#pluginTools .plugin-action')));
}

async function addAsset(page, index = 0) {
  await page.locator('.asset-item').nth(index).click();
  await page.waitForFunction(() => canvas.getObjects().filter(object => !object.excludeFromExport && !object.isGrid).length > 0);
}

async function readCanvas(page) {
  return page.evaluate(() => {
    const objects = canvas.getObjects().filter(object => !object.excludeFromExport && !object.isGrid);
    return {
      count: objects.length,
      active: canvas.getActiveObject()?.name || null,
      types: objects.map(object => object.type),
    };
  });
}

test.describe('Graphicon professional editor', () => {
  test('registers bundled and external plugins, then invokes an external tool', async ({ page }) => {
    await appReady(page);
    await expect(page.locator('#pluginCount')).toHaveText('3 个');
    await expect(page.locator('#pluginTools .plugin-action')).toHaveCount(3);
    await page.getByRole('button', { name: '圆形徽章' }).click();
    await expect.poll(() => readCanvas(page)).toMatchObject({ count: 1, active: '示例圆形徽章' });
  });

  test('creates an editable pen path and toggles a Bézier node', async ({ page }) => {
    await appReady(page);
    const result = await page.evaluate(() => {
      const path = createEditablePath([
        { x: 120, y: 150 },
        { x: 330, y: 160 },
        { x: 240, y: 360 },
      ], false);
      canvas.add(path);
      canvas.setActiveObject(path);
      enterNodeEditor(path);
      selectedNodeIndex = 0;
      toggleSelectedNodeCurve();
      return {
        editable: Boolean(path.editablePathData),
        nodes: path.editablePathData.nodes.length,
        hasC1: Boolean(path.editablePathData.nodes[0].c1),
        hasC2: Boolean(path.editablePathData.nodes[0].c2),
        controlCount: nodeControls.length,
        svgPath: buildEditablePathSvg(path.editablePathData),
      };
    });
    expect(result).toMatchObject({ editable: true, nodes: 3, hasC1: true, hasC2: true, controlCount: 5 });
    expect(result.svgPath).toContain('C');
    await expect(page.locator('#pathModeBadge')).toHaveText('3 个节点');
  });

  test('exports PNG, JPG, WebP and SVG with expected download payloads', async ({ page }) => {
    await appReady(page);
    await addAsset(page);
    const formats = [
      ['png', '.png'],
      ['jpg', '.jpg'],
      ['webp', '.webp'],
      ['svg', '.svg'],
    ];
    for (const [format, extension] of formats) {
      await page.selectOption('#exportFormat', format);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出设计稿' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(extension);
      if (format === 'svg') {
        const content = await download.createReadStream();
        let svg = '';
        for await (const chunk of content) svg += chunk;
        expect(svg).toContain('<svg');
        expect(svg).toContain('<path');
      }
    }
  });

  test('synchronizes canvas state between collaborators in the same room', async ({ browser }) => {
    const first = await browser.newPage();
    const second = await browser.newPage();
    await appReady(first);
    await appReady(second);
    const roomId = `qa-${Date.now()}`;
    for (const [page, name] of [[first, '设计师甲'], [second, '设计师乙']]) {
      await page.locator('#collabRoom').fill(roomId);
      await page.locator('#collabName').fill(name);
      await page.getByRole('button', { name: '加入' }).click();
      await expect(page.locator('#collabStatus')).toContainText(`已加入房间：${roomId}`);
    }
    await expect(first.locator('#collabMembers .collab-member')).toHaveCount(2);
    await first.waitForTimeout(350);
    await first.evaluate(() => {
      const rectangle = new fabric.Rect({ left: 170, top: 180, width: 120, height: 90, fill: '#ff4d6d' });
      prepareUserObject(rectangle, '协作矩形');
      canvas.add(rectangle);
      canvas.setActiveObject(rectangle);
      historyManager.save();
    });
    await expect.poll(() => readCanvas(second), { timeout: 8_000 }).toMatchObject({ count: 1, types: ['rect'] });
    await first.close();
    await second.close();
  });
});
