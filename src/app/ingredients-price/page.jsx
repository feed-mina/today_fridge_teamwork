"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { shoppingApi } from "@/api/shoppingApi";
import PrivateLayout from "@/components/layout/private/PrivateLayout";
import PropTypes from "prop-types";

const SHIPPING_LABEL = {
  FREE: "무료배송",
  STANDARD: "표준배송",
  EXPRESS: "빠른배송",
  NEXT_DAY: "내일도착",
};

const STOCK_STYLE = {
  IN_STOCK: { label: "재고있음", color: "text-green-600" },
  LOW_STOCK: { label: "재고부족", color: "text-orange-500" },
  OUT_OF_STOCK: { label: "품절", color: "text-red-500" },
};

const MALL_COLOR = {
  "네이버쇼핑": "#03C75A",
  "11번가": "#E0001B",
};

// 쇼핑몰별 로고 배지 (브랜드 색상 + 심볼)
function MallBadge({ mallName }) {
  const color = MALL_COLOR[mallName] ?? "#8a8078";
console.log('mallName',mallName)
  if (mallName === "네이버쇼핑") {
    return (
      <span
        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        {/* 네이버 N 심볼 */}
        <span
          className="inline-flex items-center justify-center rounded font-black text-[10px] leading-none px-0.5"
          style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}
        >
          N
        </span>
        {mallName}
      </span>
    );
  }

  if (mallName === "11번가") {
    return (
      <span
        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        {/* 11번가 숫자 심볼 */}
        <span
          className="inline-flex items-center justify-center rounded font-black text-[10px] leading-none px-0.5"
          style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}
        >
          11
        </span>
        {mallName}
      </span>
    );
  }

  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded-lg text-white"
      style={{ backgroundColor: color }}
    >
      {mallName}
    </span>
  );
}

MallBadge.propTypes = {
  mallName: PropTypes.string.isRequired,
};

// 검색 결과용 쇼핑몰 카드 (네이버/11번가 나란히 표시)
function MallCard({ item, isLowest }) {
  const MALL_COLOR = {
    "네이버쇼핑": "#03C75A",
    "11번가": "#FF0000",
  };
  const color = MALL_COLOR[item.mallName] ?? "#8a8078";
  return (
    <a
      href={item.purchaseUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 rounded-2xl p-4 flex flex-col gap-2 transition-opacity hover:opacity-80"
      style={{ backgroundColor: "#ffffff", border: `2px solid ${color}20` }}
    >
      {/* 쇼핑몰 이름 */}
      <div className="flex items-center justify-between">
        <MallBadge id='MallBadge' mallName={item.mallName} />
        {isLowest && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-green-500">
            최저가
          </span>
        )}
      </div>

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.productName || "상품 이미지"}
          width={64}
          height={64}
          className="w-16 h-16 rounded-xl object-cover mx-auto"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      <p className="text-sm text-[#3f3a36] font-medium line-clamp-2 min-h-[2.5rem]">
        {item.productName}
      </p>

      <div className="mt-auto">
        <span className="text-lg font-bold text-[#3f3a36]">
          {item.price?.toLocaleString()}원
        </span>
        {item.originalPrice && item.originalPrice > item.price && (
          <span className="text-xs text-[#b0a899] line-through ml-1">
            {item.originalPrice.toLocaleString()}원
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {item.shippingType && (
          <span className="text-xs text-[#b0a899]">
            {SHIPPING_LABEL[item.shippingType] ?? item.shippingType}
          </span>
        )}
        {item.stockStatus && STOCK_STYLE[item.stockStatus] && (
          <span className={`text-xs ${STOCK_STYLE[item.stockStatus].color}`}>
            {STOCK_STYLE[item.stockStatus].label}
          </span>
        )}
      </div>
    </a>
  );
}

MallCard.propTypes = {
  item: PropTypes.shape({
    purchaseUrl: PropTypes.string,
    imageUrl: PropTypes.string,
    productName: PropTypes.string,
    mallName: PropTypes.string,
    shippingType: PropTypes.string,
    stockStatus: PropTypes.string,
    price: PropTypes.number,
    originalPrice: PropTypes.number,
  }).isRequired,
  isLowest: PropTypes.bool.isRequired,
};

// 냉장고 재료 섹션용 기존 행 컴포넌트
function ShoppingItemRow({ item, isLowest }) {
  return (
    <a
      href={item.purchaseUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl px-4 py-3 transition-opacity hover:opacity-80"
      style={{ backgroundColor: "#ffffff60", border: "1px solid #e0d8cf" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.productName || "상품 이미지"}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-[#8a8078]">{item.mallName}</span>
          <span className="text-sm text-[#3f3a36] truncate max-w-[160px]">
            {item.productName}
          </span>
          <div className="flex gap-2 mt-0.5">
            {item.shippingType && (
              <span className="text-xs text-[#b0a899]">
                {SHIPPING_LABEL[item.shippingType] ?? item.shippingType}
              </span>
            )}
            {item.stockStatus && STOCK_STYLE[item.stockStatus] && (
              <span className={`text-xs ${STOCK_STYLE[item.stockStatus].color}`}>
                {STOCK_STYLE[item.stockStatus].label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {isLowest && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-green-500">
            최저가
          </span>
        )}
        <div className="flex flex-col items-end">
          <span className="font-bold text-[#3f3a36]">
            {item.price?.toLocaleString()}원
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-[#b0a899] line-through">
              {item.originalPrice.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

ShoppingItemRow.propTypes = {
  item: PropTypes.shape({
    purchaseUrl: PropTypes.string,
    imageUrl: PropTypes.string,
    productName: PropTypes.string,
    mallName: PropTypes.string,
    shippingType: PropTypes.string,
    stockStatus: PropTypes.string,
    price: PropTypes.number,
    originalPrice: PropTypes.number,
  }).isRequired,
  isLowest: PropTypes.bool.isRequired,
};

function PriceCard({ data }) {
  const lowestPrice = data.lowestPrice;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: "#f6f1ea" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-[#3f3a36]">{data.ingredientName}</span>
        <span className="text-sm font-semibold text-green-600">
          최저 {lowestPrice?.toLocaleString()}원~
        </span>
      </div>

      <div className="flex gap-3">
        {data.items?.map((item, idx) => (
          <MallCard
            key={item.mallProductId ?? idx}
            item={item}
            isLowest={item.price === lowestPrice}
          />
        ))}
      </div>

      {data.explanation && (
        <div className="flex items-start gap-1.5 mt-1 px-1">
          <span className="text-xs shrink-0">✨</span>
          <p className="text-xs text-[#6b6560] leading-relaxed">{data.explanation}</p>
        </div>
      )}
    </div>
  );
}

PriceCard.propTypes = {
  data: PropTypes.shape({
    ingredientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ingredientName: PropTypes.string,
    lowestPrice: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};

export default function IngredientsPrice() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [fridgeEmpty, setFridgeEmpty] = useState(false);

  // 냉장고 식재료 기반 최저가 조회 (진입 시 자동 호출, 비어있으면 안내 메시지 표시)
  const fetchFridgePrices = useCallback(async () => {
    setLoading(true);
    setFridgeEmpty(false);
    try {
      const res = await shoppingApi.getFridgePrices();
      const dataPayload = res.data?.data || res.data;
      const list = Array.isArray(dataPayload) ? dataPayload : [];
      if (list.length > 0) {
        setPriceData(list);
      } else {
        setPriceData([]);
        setFridgeEmpty(true);
      }
    } catch (err) {
      console.error("냉장고 가격 조회 실패:", err?.message);
      setPriceData([]);
      setFridgeEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL query param ?search=간장 이 있으면 자동 검색 실행
  useEffect(() => {
    const keyword = searchParams.get("search");
    if (keyword?.trim()) {
      setSearchLoading(true);
      shoppingApi.searchByKeyword(keyword.trim())
        .then((res) => {
          const data = res.data?.data || res.data;
          setSearchResult(data);
        })
        .catch((err) => {
          console.error("자동 검색 실패:", err?.message);
          setSearchResult(null);
        })
        .finally(() => setSearchLoading(false));
    } else {
      fetchFridgePrices();
    }
  }, [searchParams, fetchFridgePrices]);

  const handleSearch = useCallback(async () => {
    const keyword = search.trim();
    if (!keyword) {
      setSearchResult(null);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await shoppingApi.searchByKeyword(keyword);
      const data = res.data?.data || res.data;
      setSearchResult(data);
    } catch (err) {
      console.error("키워드 검색 실패:", err?.message);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  }, [search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (!e.target.value.trim()) {
      setSearchResult(null);
    }
  };

  const filtered = priceData.filter((item) =>
    item.ingredientName?.includes(search.trim())
  );

  const showSearchResult = searchResult && searchResult.items && searchResult.items.length > 0;

  return (
    <PrivateLayout>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#3f3a36]">식재료 최저가 비교</h1>
            {showSearchResult && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300">
                ✨ 실시간 검색
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a8078] mt-1">
            식재료명을 입력하고 검색 버튼을 누르면 실시간 최저가를 비교할 수 있습니다
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="재료명을 검색하세요 (예: 계란, 대파)"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full max-w-md rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: "#f6f1ea",
              border: "1px solid #e0d8cf",
              color: "#3f3a36",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading || !search.trim()}
            className="rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: search.trim() ? "#4ade80" : "#f6f1ea",
              border: "1px solid #e0d8cf",
              color: search.trim() ? "#ffffff" : "#3f3a36",
            }}
          >
            {searchLoading ? "검색 중..." : "🔍 실시간 검색"}
          </button>
          <button
            onClick={fetchFridgePrices}
            className="rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#f6f1ea", border: "1px solid #e0d8cf", color: "#3f3a36" }}
          >
            🔄 냉장고
          </button>
        </div>

        {/* 실시간 검색 로딩 */}
        {searchLoading && (
          <div className="text-center py-8 text-[#8a8078]">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-green-400 border-t-transparent mb-2" />
            <p>&quot;{search}&quot; 실시간 최저가를 검색하고 있습니다...</p>
            <p className="text-xs mt-1">네이버쇼핑 + 11번가에서 동시 검색 중</p>
          </div>
        )}
        {showSearchResult && !searchLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#3f3a36]">
                &quot;{searchResult.ingredientName}&quot; 검색 결과
              </h2>
              <span className="text-xs text-[#b0a899]">
                {searchResult.items.length}개 상품
              </span>
            </div>
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ backgroundColor: "#f6f1ea" }}
            >
              <span className="text-sm font-semibold text-green-600">
                최저 {searchResult.lowestPrice?.toLocaleString()}원~
              </span>
              <div className="flex gap-3">
                {searchResult.items.map((item, idx) => (
                  <MallCard
                    key={item.mallProductId ?? idx}
                    item={item}
                    isLowest={item.price === searchResult.lowestPrice}
                  />
                ))}
              </div>

              {searchResult.explanation && (
                <div className="flex items-start gap-1.5 px-1">
                  <span className="text-xs shrink-0">✨</span>
                  <p className="text-xs text-[#6b6560] leading-relaxed">{searchResult.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {searchResult && searchResult.items?.length === 0 && !searchLoading && (
          <div className="text-center py-8 text-[#8a8078]">
            &quot;{searchResult.ingredientName}&quot;에 대한 검색 결과가 없습니다.
          </div>
        )}

        {/* 구분선 */}
        {showSearchResult && !searchLoading && filtered.length > 0 && (
          <hr className="border-[#e0d8cf]" />
        )}

        {/* 기본/냉장고 재료 섹션 */}
        {!showSearchResult && loading && (
          <div className="text-center py-16 text-[#8a8078]">
            가격 정보를 불러오는 중입니다...
          </div>
        )}

        {searchResult === null && !loading && filtered.length === 0 && fridgeEmpty && (
          <div className="text-center py-16 text-[#8a8078]">
            <p className="text-lg mb-2">🧊 냉장고가 비어있어요</p>
            <p className="text-sm">냉장고에 식재료를 추가하면 최저가를 확인할 수 있어요</p>
          </div>
        )}

        {searchResult === null && !loading && filtered.length === 0 && !fridgeEmpty && search && (
          <div className="text-center py-16 text-[#8a8078]">
            검색 결과가 없습니다.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {showSearchResult && (
              <h2 className="text-lg font-semibold text-[#3f3a36] mb-3">예시 식재료 가격</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {filtered.map((data) => (
                <PriceCard key={data.ingredientId ?? data.ingredientName} data={data} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PrivateLayout>
  );
}
