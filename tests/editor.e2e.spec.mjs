import { test, expect } from '@playwright/test';

async function appReady(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.Graphicon && window.paper && document.querySelector('#pluginTools .plugin-action')));
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
  test('keeps the six-category icon library visible before advanced panels and adds an icon', async ({ page }) => {
    await appReady(page);
    await expect(page.locator('.library-heading')).toContainText('图标素材库');
    await expect(page.locator('#lib-root .accordion-header')).toHaveCount(6);
    const layout = await page.evaluate(() => {
      const library = document.querySelector('.library-section')?.getBoundingClientRect();
      const aiPanel = document.querySelector('.ai-card')?.getBoundingClientRect();
      return {
        libraryTop: library?.top,
        libraryBottom: library?.bottom,
        aiTop: aiPanel?.top,
        viewportHeight: window.innerHeight,
      };
    });
    expect(layout.libraryTop).toBeGreaterThanOrEqual(0);
    expect(layout.libraryBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.aiTop).toBeGreaterThan(layout.libraryTop);
    await page.locator('#lib-root .accordion-header').nth(1).click();
    await expect(page.locator('#lib-root .accordion-content.show .asset-item').first()).toBeVisible();
    await page.locator('#lib-root .accordion-content.show .asset-item').first().click();
    await expect.poll(() => readCanvas(page)).toMatchObject({ count: 1, active: '图标路径' });
  });

  test('registers bundled and external plugins, then invokes an external tool', async ({ page }) => {
    await appReady(page);
    await expect(page.locator('#pluginCount')).toHaveText('3 个');
    await expect(page.locator('#pluginTools .plugin-action')).toHaveCount(3);
    await page.getByRole('button', { name: '圆形徽章' }).click();
    await expect.poll(() => readCanvas(page)).toMatchObject({ count: 1, active: '示例圆形徽章' });
  });

  test('creates an editable pen path and toggles a Bézier node', async ({ page }) => {
    await appReady(page);
    const result = await page.evaluate(async () => {
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
      await new Promise(resolve => requestAnimationFrame(resolve));
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

  test('records transactional history across canvas and grid changes, then restores with undo and redo', async ({ page }) => {
    await appReady(page);
    const initial = await page.evaluate(() => {
      canvas.clear();
      isGridActive = false;
      gridGroup = null;
      historyManager.reset('测试初始状态');
      historyManager.transaction('添加两枚测试图形', () => {
        const first = new fabric.Rect({ left: 130, top: 150, width: 100, height: 90, fill: '#ff725c' });
        const second = new fabric.Circle({ left: 380, top: 310, radius: 50, fill: '#4c9aff' });
        prepareUserObject(first, '历史矩形');
        prepareUserObject(second, '历史圆形');
        canvas.add(first, second);
      });
      toggleGrid();
      return { undo: historyManager.undoStack.length, redo: historyManager.redoStack.length, grid: isGridActive, count: getUserObjects().length };
    });
    expect(initial).toMatchObject({ undo: 2, redo: 0, grid: true, count: 2 });
    await page.evaluate(() => historyManager.undo());
    await expect.poll(() => page.evaluate(() => ({ grid: isGridActive, count: getUserObjects().length, redo: historyManager.redoStack.length }))).toMatchObject({ grid: false, count: 2, redo: 1 });
    await page.evaluate(() => historyManager.undo());
    await expect.poll(() => page.evaluate(() => ({ grid: isGridActive, count: getUserObjects().length }))).toMatchObject({ grid: false, count: 0 });
    await page.evaluate(() => { historyManager.redo(); historyManager.redo(); });
    await expect.poll(() => page.evaluate(() => ({ grid: isGridActive, count: getUserObjects().length, undo: historyManager.undoStack.length }))).toMatchObject({ grid: true, count: 2, undo: 2 });
    await expect(page.locator('#historyStatus')).toContainText('撤销 2');
  });

  test('applies local intelligent layout as one reversible transaction', async ({ page }) => {
    await appReady(page);
    const result = await page.evaluate(() => {
      canvas.clear();
      historyManager.reset('布局初始状态');
      const shapes = [
        new fabric.Rect({ left: 60, top: 65, width: 180, height: 90, fill: '#ff725c' }),
        new fabric.Circle({ left: 520, top: 130, radius: 70, fill: '#4c9aff' }),
        new fabric.Triangle({ left: 250, top: 560, width: 150, height: 130, fill: '#52c41a' }),
      ];
      shapes.forEach((shape, index) => { prepareUserObject(shape, `布局对象 ${index + 1}`); canvas.add(shape); });
      historyManager.reset('布局初始状态');
      const before = shapes.map(shape => ({ left: shape.left, top: shape.top }));
      autoLayoutCanvas();
      const after = getUserObjects().map(shape => ({ left: Math.round(shape.left), top: Math.round(shape.top) }));
      historyManager.undo();
      return { before, after, undoCount: historyManager.undoStack.length };
    });
    expect(result.undoCount).toBe(0);
    expect(result.after).not.toEqual(result.before);
    await expect.poll(() => page.evaluate(() => getUserObjects().map(shape => ({ left: shape.left, top: shape.top })))).toEqual(result.before);
  });

  test('runs Paper.js boolean operations and exports the editable union as SVG', async ({ page }) => {
    await appReady(page);
    const operations = ['subtract', 'intersect', 'exclude', 'unite'];
    for (const operation of operations) {
      const result = await page.evaluate(operationName => {
        canvas.clear();
        const first = new fabric.Rect({ left: 180, top: 210, width: 190, height: 140, fill: '#ff725c', stroke: '#d84d39', strokeWidth: 3 });
        const second = new fabric.Rect({ left: 285, top: 260, width: 190, height: 140, fill: '#4c9aff', stroke: '#2478d4', strokeWidth: 3 });
        prepareUserObject(first, '路径 A');
        prepareUserObject(second, '路径 B');
        canvas.add(first, second);
        canvas.setActiveObject(new fabric.ActiveSelection([first, second], { canvas }));
        booleanPath(operationName);
        const active = canvas.getActiveObject();
        return { paperLoaded: Boolean(window.paper), count: canvas.getObjects().filter(object => !object.excludeFromExport && !object.isGrid).length, editable: Boolean(active?.editablePathData), name: active?.name };
      }, operation);
      expect(result).toMatchObject({ paperLoaded: true, count: 1 });
      expect(result.name).toContain('路径');
      if (operation === 'unite') expect(result.editable).toBe(true);
    }
    await page.selectOption('#exportFormat', 'svg');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出设计稿' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let svg = '';
    for await (const chunk of stream) svg += chunk;
    expect(svg).toContain('<path');
  });

  test('simplifies and smooths editable Bézier paths while preserving edit metadata', async ({ page }) => {
    await appReady(page);
    const result = await page.evaluate(() => {
      const path = createEditablePath([
        { x: 150, y: 230 }, { x: 220, y: 155 }, { x: 305, y: 205 },
        { x: 340, y: 290 }, { x: 285, y: 360 }, { x: 190, y: 330 },
      ], true, { name: '待优化路径' });
      canvas.add(path);
      canvas.setActiveObject(path);
      smoothSelectedPath();
      const smoothed = canvas.getActiveObject();
      simplifySelectedPath();
      const simplified = canvas.getActiveObject();
      return {
        smoothEditable: Boolean(smoothed?.editablePathData),
        simplifyEditable: Boolean(simplified?.editablePathData),
        nodeCount: simplified?.editablePathData?.nodes?.length || 0,
        svg: simplified?.toSVG() || '',
      };
    });
    expect(result).toMatchObject({ smoothEditable: true, simplifyEditable: true });
    expect(result.nodeCount).toBeGreaterThanOrEqual(2);
    expect(result.svg).toContain('<path');
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
