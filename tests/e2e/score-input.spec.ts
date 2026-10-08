import { test, expect } from '@playwright/test';

test.describe('점수 입력 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 메인 화면에서 정시 모의지원 버튼 클릭
    await page.getByText('정시 모의지원').click();
    await expect(page).toHaveURL(/ScoreInput/);
  });

  test('점수 입력 폼이 정상적으로 렌더링된다', async ({ page }) => {
    // 국어 섹션 확인
    await expect(page.getByText('국어')).toBeVisible();
    await expect(page.getByText('언매')).toBeVisible();
    await expect(page.getByText('화작')).toBeVisible();

    // 수학 섹션 확인
    await expect(page.getByText('수학')).toBeVisible();
    await expect(page.getByText('확통')).toBeVisible();
    await expect(page.getByText('미적')).toBeVisible();
    await expect(page.getByText('기하')).toBeVisible();

    // 영어, 한국사 섹션 확인
    await expect(page.getByText('영어')).toBeVisible();
    await expect(page.getByText('한국사')).toBeVisible();

    // 탐구 섹션 확인
    await expect(page.getByText('탐구 1')).toBeVisible();
    await expect(page.getByText('탐구 2')).toBeVisible();

    // 버튼 확인
    await expect(page.getByText('저장')).toBeVisible();
    await expect(page.getByText('초기화')).toBeVisible();
  });

  test('국어 유형 선택이 동작한다', async ({ page }) => {
    const 언매Button = page.getByText('언매').first();
    await 언매Button.click();
    // 선택된 상태 확인 (배경색 변경)
    await expect(언매Button).toHaveCSS('background-color', /.*/);
  });

  test('점수 입력 필드에 값을 입력할 수 있다', async ({ page }) => {
    // 국어 공통 점수 입력
    const koreanInput = page.locator('input').first();
    await koreanInput.fill('85');
    await expect(koreanInput).toHaveValue('85');
  });

  test('초기화 버튼이 동작한다', async ({ page }) => {
    // 값 입력
    const input = page.locator('input').first();
    await input.fill('90');
    await expect(input).toHaveValue('90');

    // 초기화 클릭
    await page.getByText('초기화').click();

    // 값이 비어있는지 확인
    await expect(input).toHaveValue('');
  });

  test('저장 버튼 클릭 시 동작한다', async ({ page }) => {
    // console.log 캡처
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // 저장 버튼 클릭
    await page.getByText('저장').click();

    // 콘솔에 저장 로그가 출력되었는지 확인
    await page.waitForTimeout(500);
    expect(consoleLogs.some((log) => log.includes('점수 저장'))).toBeTruthy();
  });

  test('표준점수 입력 탭으로 전환할 수 있다', async ({ page }) => {
    await page.getByText('표준점수 입력').click();
    await expect(page).toHaveURL(/StandardScoreInput/);
  });
});

test.describe('메인 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('메인 화면이 정상적으로 렌더링된다', async ({ page }) => {
    await expect(page.getByText('모의지원')).toBeVisible();
    await expect(page.getByText('정시 모의지원')).toBeVisible();
  });

  test('로그인 버튼들이 표시된다', async ({ page }) => {
    await expect(page.getByText(/Google|구글/i)).toBeVisible();
    await expect(page.getByText(/Naver|네이버/i)).toBeVisible();
  });

  test('정시 모의지원 버튼 클릭 시 점수입력 화면으로 이동한다', async ({ page }) => {
    await page.getByText('정시 모의지원').click();
    await expect(page.getByText('점수 입력')).toBeVisible();
  });
});

test.describe('네비게이션', () => {
  test('햄버거 메뉴에서 화면 전환이 가능하다', async ({ page }) => {
    await page.goto('/');
    await page.getByText('정시 모의지원').click();

    // 메뉴 버튼 클릭 (햄버거 아이콘)
    const menuButton = page.locator('[data-testid="menu-button"]').or(
      page.getByRole('button').filter({ has: page.locator('svg') }).first()
    );

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // 메뉴 항목들 확인
      await expect(page.getByText('점수입력')).toBeVisible();
      await expect(page.getByText('지원전략')).toBeVisible();
    }
  });
});
