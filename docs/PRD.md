# 커피 주문 앱

## 1. 프로젝트 개요

### 1.1 프로젝트명
커피 주문 앱 

### 1.2 프로젝트 목적 
사용자가 커피 메뉴를 주문하고, 관리자가 주문을 관리할 수 있는 간단한 풀스텍 웹 앱 

### 1.3 개발 범위
- 주문하기 화면(메뉴 선택 및 장바구니 기능) — 상세: [PRD-order-screen.md](./PRD-order-screen.md)
- 관리자 화면(재고 관리 및 주문 상태 관리) — 상세: [PRD-admin-screen.md](./PRD-admin-screen.md)
- 데이터를 생성/조회/수정/삭제할 수 있는 기능

##2. 기술 스택
-프린트엔드 : HTML, CSS, 리엑트, 자바스크립트
- 백엔드 : Node, js, Express
- 데이터베이스 : postgreSQL

## 3. 기본 사항
- 프런트엔드와 백엔드를 따로 개발
- 기본적인 웹 기술만 사용
- 학습 목적이므로 사용자 인증이나 결제 기능은 제외
- 메뉴는 커피 메뉴만 있음

## 4. 백엔드 PRD

### 4.1 데이터 모델

#### 4.1.1 Menus
- 커피 이름(`name`)
- 설명(`description`)
- 가격(`price`)
- 이미지(`imageUrl`)
- 재고 수량(`stockQuantity`)

#### 4.1.2 Options
- 옵션 이름(`name`)
- 옵션 가격(`extraPrice`)
- 연결할 메뉴(`menuId`)

#### 4.1.3 Orders
- 주문 일시(`orderedAt`)
- 주문 상태(`status`) - 기본값: `PENDING(주문 접수)`
- 주문 내용(`items`)
  - 메뉴(`menuId`, `menuName`)
  - 수량(`quantity`)
  - 옵션(`optionIds`, `optionNames`)
  - 금액(`unitPrice`, `lineTotal`, `totalAmount`)

---

### 4.2 데이터 스키마를 위한 사용자 흐름

1. **메뉴 조회 및 화면 표시**
   - `Menus`의 내용을 조회해서 브라우저 화면(주문하기)에 표시한다.
   - `Menus` 정보 중 재고 수량(`stockQuantity`)은 관리자 화면에서 표시한다.

2. **사용자 선택 및 장바구니 반영**
   - 사용자가 앱 화면에서 커피 메뉴와 옵션을 선택해 장바구니에 담는다.
   - 선택 정보(메뉴, 옵션, 수량, 금액)는 장바구니에 즉시 표시된다.

3. **주문 생성**
   - 장바구니에서 `주문하기` 버튼을 클릭하면 주문 정보를 `Orders`에 저장한다.
   - `Orders`에는 주문 시간과 주문 내용(메뉴, 수량, 옵션, 금액)을 포함한다.

4. **관리자 주문 현황 표시 및 상태 변경**
   - `Orders`의 정보를 관리자 화면의 `주문 현황`에 표시한다.
   - 주문 기본 상태는 `주문 접수(PENDING)`이다.
   - 관리자 액션으로 상태를 `주문 접수 -> 제조 중 -> 완료`로 변경한다.

---

### 4.3 API 설계

#### 4.3.1 주문하기 메뉴 진입 시 메뉴 목록 조회
- **Endpoint**: `GET /menus`
- **설명**: 데이터베이스에서 커피 메뉴 목록을 조회해 주문하기 화면에 표시한다.
- **응답 예시 필드**: `id`, `name`, `description`, `price`, `imageUrl`, `options[]`

#### 4.3.2 주문 생성
- **Endpoint**: `POST /orders`
- **설명**: 사용자가 선택한 커피/옵션/수량 정보를 주문으로 저장한다.
- **요청 본문 예시**

```json
{
  "items": [
    {
      "menuId": "americano-ice",
      "quantity": 2,
      "optionIds": ["extra-shot"],
      "unitPrice": 4500,
      "lineTotal": 9000
    }
  ],
  "totalAmount": 9000
}
```

- **서버 처리**
  - `Orders` 및 주문 상세 항목 저장
  - 주문 정보에 따라 메뉴 재고(`Menus.stockQuantity`) 차감
  - 재고 부족 시 주문 생성 실패 처리(에러 반환)

#### 4.3.3 주문 ID 기반 주문 상세 조회
- **Endpoint**: `GET /orders/:orderId`
- **설명**: 주문 ID를 전달하면 해당 주문의 상세 정보를 반환한다.
- **응답 필드 예시**: `orderId`, `orderedAt`, `status`, `items[]`, `totalAmount`