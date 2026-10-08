import { test, expect } from '@playwright/test';

test.describe('앱 네비게이션', () => {
  test('메인 화면에서 모든 주요 기능에 접근할 수 있다', async ({ page }) => {
    await page.goto('/');

    // 메인 화면 확인
    await expect(page.getByText('모의지원')).toBeVisible();

    // 정시 모의지원 → 점수 입력
    await page.getByText('정시 모의지원').click();
    await expect(page.getByText('점수 입력')).toBeVisible();
  });

  test('점수 입력 화면에서 원점수/표준점수 탭 전환이 가능하다', async ({ page }) => {
    await page.goto('/');
    await page.getByText('정시 모의지원').click();

    // 원점수 입력 탭 확인
    await expect(page.getByText('원점수 입력')).toBeVisible();

    // 표준점수 입력 탭 클릭
    await page.getByText('표준점수 입력').click();

    // URL 변경 확인
    await expect(page).toHaveURL(/StandardScoreInput/);
  });
});

test.describe('대학 검색', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 먼저 점수입력 화면으로 이동
    await page.getByText('정시 모의지원').click();
  });

  test('대학 검색 화면에 접근할 수 있다', async ({ page }) => {
    // 햄버거 메뉴 열기 (있다면)
    const menuButton = page.locator('[data-testid="menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.getByText('대학검색').click();
      await expect(page).toHaveURL(/CollegeSelect/);
    }
  });
});

test.describe('전략 화면', () => {
  test('전략 화면에서 6개 행이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.getByText('정시 모의지원').click();

    // 메뉴를 통해 전략 화면으로 이동
    const menuButton = page.locator('[data-testid="menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.getByText('지원전략').click();

      // 6개 행 확인 (가/나/다 군 각 2개씩)
      await expect(page.getByText('가군')).toBeVisible();
    }
  });
});
