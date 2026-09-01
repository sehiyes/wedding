-- =========================================================
-- "permission denied for table ..." (42501) 오류를 바로 해결하는 스크립트
-- 테이블은 이미 만들어져 있으니 이 부분만 SQL Editor에 붙여넣고 실행하면 됩니다.
-- =========================================================

grant usage on schema public to anon;

-- 방명록: 쓰기 + 읽기 모두 허용
grant select, insert on guestbook_messages to anon;

-- 참석여부: 쓰기만 허용 (읽기 권한은 일부러 주지 않음 - 관리자만 함수로 조회)
grant insert on rsvps to anon;

-- id가 자동 증가(identity) 컬럼이라 INSERT할 때 시퀀스 사용 권한도 필요합니다.
grant usage, select on all sequences in schema public to anon;
