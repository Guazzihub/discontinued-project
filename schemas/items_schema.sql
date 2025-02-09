CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    u_name VARCHAR(255) NOT NULL,
    u_description TEXT,
    u_state VARCHAR(2) NOT NULL,
    u_city VARCHAR(100) NOT NULL,
    u_uf VARCHAR(2) NOT NULL,
    u_value DECIMAL(10,2),
    u_price_01 DECIMAL(10,2) NOT NULL,
    u_price_02 DECIMAL(10,2),
    u_price_03 DECIMAL(10,2),
    u_discount DECIMAL(5,2) DEFAULT 0,
    u_picture_01 VARCHAR(255),
    u_picture_02 VARCHAR(255),
    u_picture_03 VARCHAR(255),
    u_date_01 DATETIME,
    u_date_02 DATETIME,
    u_date_03 DATETIME,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_item_state ON items(u_state);
CREATE INDEX idx_item_city ON items(u_city);
CREATE INDEX idx_item_user ON items(user_id);
