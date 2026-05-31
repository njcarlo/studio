CREATE OR REPLACE FUNCTION adjust_item_stock(
  p_item_id   UUID,
  p_delta     INTEGER,
  p_adj_type  TEXT,
  p_worker_id TEXT DEFAULT NULL,
  p_notes     TEXT DEFAULT NULL
) RETURNS TABLE(new_quantity INTEGER, actual_delta INTEGER) AS $$
DECLARE
  v_old INTEGER;
  v_new INTEGER;
  v_actual INTEGER;
BEGIN
  SELECT quantity INTO v_old FROM "InventoryItem" WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
  v_new    := GREATEST(0, v_old + p_delta);
  v_actual := v_new - v_old;
  UPDATE "InventoryItem" SET quantity = v_new, "updatedAt" = now() WHERE id = p_item_id;
  INSERT INTO "InventoryLog"("itemId","workerId",type,quantity,balance,notes,timestamp)
  VALUES(p_item_id,p_worker_id,p_adj_type,ABS(p_delta),v_new,p_notes,now());
  RETURN QUERY SELECT v_new, v_actual;
END;
$$ LANGUAGE plpgsql;
