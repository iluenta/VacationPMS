-- ============================================================================
-- SCRIPT 094: CREAR TABLAS PARA GESTIÓN DE PERSONAS
-- ============================================================================
-- Descripción: Crea las tablas necesarias para el sistema de gestión de personas
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA PRINCIPAL DE PERSONAS
-- ============================================================================

CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    person_type_id UUID REFERENCES configuration_types(id) ON DELETE RESTRICT,
    
    -- Información básica
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    business_name VARCHAR(200),
    identification_type VARCHAR(20) NOT NULL CHECK (identification_type IN ('DNI', 'CIF', 'NIE', 'PASSPORT')),
    identification_number VARCHAR(50) NOT NULL,
    
    -- Tipo de persona
    person_category VARCHAR(20) NOT NULL CHECK (person_category IN ('PHYSICAL', 'LEGAL')),
    
    -- Metadatos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT persons_identification_unique UNIQUE (tenant_id, identification_type, identification_number),
    CONSTRAINT persons_name_check CHECK (
        (person_category = 'PHYSICAL' AND first_name IS NOT NULL AND last_name IS NOT NULL AND business_name IS NULL) OR
        (person_category = 'LEGAL' AND business_name IS NOT NULL AND first_name IS NULL AND last_name IS NULL)
    )
);

-- ============================================================================
-- TABLA DE INFORMACIÓN DE CONTACTO
-- ============================================================================

CREATE TABLE person_contact_infos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Información de contacto
    contact_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    position VARCHAR(100),
    
    -- Configuración
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT contact_info_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL),
    CONSTRAINT contact_info_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- TABLA DE DOMICILIO FISCAL
-- ============================================================================

CREATE TABLE person_fiscal_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Dirección
    street VARCHAR(200) NOT NULL,
    number VARCHAR(20),
    floor VARCHAR(20),
    door VARCHAR(20),
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',
    
    -- Metadatos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para persons
CREATE INDEX idx_persons_tenant_id ON persons(tenant_id);
CREATE INDEX idx_persons_type_id ON persons(person_type_id);
CREATE INDEX idx_persons_identification ON persons(tenant_id, identification_type, identification_number);
CREATE INDEX idx_persons_category ON persons(person_category);
CREATE INDEX idx_persons_active ON persons(is_active);
CREATE INDEX idx_persons_created_at ON persons(created_at);

-- Índices para person_contact_infos
CREATE INDEX idx_contact_infos_person_id ON person_contact_infos(person_id);
CREATE INDEX idx_contact_infos_tenant_id ON person_contact_infos(tenant_id);
CREATE INDEX idx_contact_infos_primary ON person_contact_infos(person_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_contact_infos_email ON person_contact_infos(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contact_infos_phone ON person_contact_infos(phone) WHERE phone IS NOT NULL;

-- Índices para person_fiscal_addresses
CREATE INDEX idx_fiscal_addresses_person_id ON person_fiscal_addresses(person_id);
CREATE INDEX idx_fiscal_addresses_tenant_id ON person_fiscal_addresses(tenant_id);
CREATE INDEX idx_fiscal_addresses_postal_code ON person_fiscal_addresses(postal_code);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Trigger para persons
CREATE OR REPLACE FUNCTION update_persons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW
    EXECUTE FUNCTION update_persons_updated_at();

-- Trigger para person_contact_infos
CREATE OR REPLACE FUNCTION update_contact_infos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_infos_updated_at
    BEFORE UPDATE ON person_contact_infos
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_infos_updated_at();

-- Trigger para person_fiscal_addresses
CREATE OR REPLACE FUNCTION update_fiscal_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fiscal_addresses_updated_at
    BEFORE UPDATE ON person_fiscal_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_addresses_updated_at();

-- ============================================================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_contact_infos ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_fiscal_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para persons
CREATE POLICY "Users can view persons in their tenant" ON persons
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert persons in their tenant" ON persons
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update persons in their tenant" ON persons
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete persons in their tenant" ON persons
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Políticas para person_contact_infos
CREATE POLICY "Users can view contact infos in their tenant" ON person_contact_infos
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contact infos in their tenant" ON person_contact_infos
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update contact infos in their tenant" ON person_contact_infos
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete contact infos in their tenant" ON person_contact_infos
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Políticas para person_fiscal_addresses
CREATE POLICY "Users can view fiscal addresses in their tenant" ON person_fiscal_addresses
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert fiscal addresses in their tenant" ON person_fiscal_addresses
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update fiscal addresses in their tenant" ON person_fiscal_addresses
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete fiscal addresses in their tenant" ON person_fiscal_addresses
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para obtener el nombre completo de una persona
CREATE OR REPLACE FUNCTION get_person_full_name(person_row persons)
RETURNS TEXT AS $$
BEGIN
    IF person_row.person_category = 'PHYSICAL' THEN
        RETURN COALESCE(person_row.first_name, '') || ' ' || COALESCE(person_row.last_name, '');
    ELSE
        RETURN person_row.business_name;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para validar DNI español
CREATE OR REPLACE FUNCTION validate_dni(dni TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    dni_numbers TEXT;
    dni_letter TEXT;
    expected_letter TEXT;
    letter_map TEXT[] := ARRAY['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'];
BEGIN
    -- Verificar formato básico
    IF dni !~ '^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$' THEN
        RETURN FALSE;
    END IF;
    
    -- Extraer números y letra
    dni_numbers := SUBSTRING(dni FROM 1 FOR 8);
    dni_letter := UPPER(SUBSTRING(dni FROM 9 FOR 1));
    
    -- Calcular letra esperada
    expected_letter := letter_map[(dni_numbers::INTEGER % 23) + 1];
    
    RETURN dni_letter = expected_letter;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para validar CIF español
CREATE OR REPLACE FUNCTION validate_cif(cif TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cif_letter TEXT;
    cif_numbers TEXT;
    cif_control TEXT;
    sum INTEGER := 0;
    i INTEGER;
    digit INTEGER;
    control_digit INTEGER;
BEGIN
    -- Verificar formato básico
    IF cif !~ '^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$' THEN
        RETURN FALSE;
    END IF;
    
    -- Extraer partes
    cif_letter := UPPER(SUBSTRING(cif FROM 1 FOR 1));
    cif_numbers := SUBSTRING(cif FROM 2 FOR 7);
    cif_control := UPPER(SUBSTRING(cif FROM 9 FOR 1));
    
    -- Calcular suma de control
    FOR i IN 1..7 LOOP
        digit := (SUBSTRING(cif_numbers FROM i FOR 1))::INTEGER;
        IF i % 2 = 0 THEN
            sum := sum + digit;
        ELSE
            sum := sum + (digit * 2) % 10 + (digit * 2) / 10;
        END IF;
    END LOOP;
    
    control_digit := (10 - (sum % 10)) % 10;
    
    -- Verificar según tipo de CIF
    IF cif_letter IN ('A', 'B', 'E', 'H') THEN
        RETURN cif_control = control_digit::TEXT;
    ELSIF cif_letter IN ('C', 'D', 'F', 'G', 'J', 'U', 'V') THEN
        RETURN cif_control = CHR(ASCII('A') + control_digit - 1);
    ELSE
        RETURN TRUE; -- Para otros tipos, asumimos válido si pasa el formato
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================================================

COMMENT ON TABLE persons IS 'Tabla principal de personas físicas y jurídicas';
COMMENT ON COLUMN persons.id IS 'Identificador único de la persona';
COMMENT ON COLUMN persons.tenant_id IS 'ID del tenant al que pertenece la persona';
COMMENT ON COLUMN persons.person_type_id IS 'ID del tipo de persona (cliente, proveedor, etc.)';
COMMENT ON COLUMN persons.first_name IS 'Nombre (solo para personas físicas)';
COMMENT ON COLUMN persons.last_name IS 'Apellido (solo para personas físicas)';
COMMENT ON COLUMN persons.business_name IS 'Razón social (solo para personas jurídicas)';
COMMENT ON COLUMN persons.identification_type IS 'Tipo de identificación (DNI, CIF, NIE, PASSPORT)';
COMMENT ON COLUMN persons.identification_number IS 'Número de identificación';
COMMENT ON COLUMN persons.person_category IS 'Categoría de persona (PHYSICAL o LEGAL)';
COMMENT ON COLUMN persons.is_active IS 'Indica si la persona está activa';

COMMENT ON TABLE person_contact_infos IS 'Información de contacto de las personas';
COMMENT ON COLUMN person_contact_infos.id IS 'Identificador único del contacto';
COMMENT ON COLUMN person_contact_infos.person_id IS 'ID de la persona a la que pertenece el contacto';
COMMENT ON COLUMN person_contact_infos.contact_name IS 'Nombre de la persona de contacto';
COMMENT ON COLUMN person_contact_infos.phone IS 'Teléfono de contacto';
COMMENT ON COLUMN person_contact_infos.email IS 'Email de contacto';
COMMENT ON COLUMN person_contact_infos.position IS 'Cargo o posición de la persona de contacto';
COMMENT ON COLUMN person_contact_infos.is_primary IS 'Indica si es el contacto principal';

COMMENT ON TABLE person_fiscal_addresses IS 'Domicilios fiscales de las personas';
COMMENT ON COLUMN person_fiscal_addresses.id IS 'Identificador único del domicilio fiscal';
COMMENT ON COLUMN person_fiscal_addresses.person_id IS 'ID de la persona a la que pertenece el domicilio';
COMMENT ON COLUMN person_fiscal_addresses.street IS 'Calle del domicilio';
COMMENT ON COLUMN person_fiscal_addresses.number IS 'Número del domicilio';
COMMENT ON COLUMN person_fiscal_addresses.floor IS 'Piso del domicilio';
COMMENT ON COLUMN person_fiscal_addresses.door IS 'Puerta del domicilio';
COMMENT ON COLUMN person_fiscal_addresses.postal_code IS 'Código postal';
COMMENT ON COLUMN person_fiscal_addresses.city IS 'Ciudad';
COMMENT ON COLUMN person_fiscal_addresses.province IS 'Provincia';
COMMENT ON COLUMN person_fiscal_addresses.country IS 'País';

-- ============================================================================
-- VERIFICACIÓN DE LA CREACIÓN
-- ============================================================================

DO $$
BEGIN
    -- Verificar que las tablas se crearon correctamente
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'persons') THEN
        RAISE EXCEPTION 'La tabla persons no se creó correctamente';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_contact_infos') THEN
        RAISE EXCEPTION 'La tabla person_contact_infos no se creó correctamente';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_fiscal_addresses') THEN
        RAISE EXCEPTION 'La tabla person_fiscal_addresses no se creó correctamente';
    END IF;
    
    RAISE NOTICE 'Todas las tablas de personas se crearon correctamente';
END $$;
