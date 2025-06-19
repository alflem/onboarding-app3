-- Hämta Xlent Luleås checklista med kategorier och tillhörande tasks
-- Sorterat enligt order-kolumnerna

SELECT
    o.name AS organization_name,
    o.id AS organization_id,
    cl.id AS checklist_id,
    cl.created_at AS checklist_created,
    cat.id AS category_id,
    cat.name AS category_name,
    cat.order AS category_order,
    t.id AS task_id,
    t.title AS task_title,
    t.description AS task_description,
    t.link AS task_link,
    t.order AS task_order,
    t.is_buddy_task AS is_buddy_task,
    t.created_at AS task_created
FROM
    "Organization" o
    LEFT JOIN "Checklist" cl ON o.id = cl.organization_id
    LEFT JOIN "Category" cat ON cl.id = cat.checklist_id
    LEFT JOIN "Task" t ON cat.id = t.category_id
WHERE
    o.name ILIKE '%xlent%'
    AND o.name ILIKE '%luleå%'
ORDER BY
    cat.order ASC,
    t.order ASC;

-- Alternativ query om du vet exakt organisationsnamn:
-- WHERE o.name = 'Xlent Luleå'

-- För att se bara kategorier utan tasks:
/*
SELECT
    o.name AS organization_name,
    cl.id AS checklist_id,
    cat.id AS category_id,
    cat.name AS category_name,
    cat.order AS category_order,
    COUNT(t.id) AS task_count
FROM
    "Organization" o
    LEFT JOIN "Checklist" cl ON o.id = cl.organization_id
    LEFT JOIN "Category" cat ON cl.id = cat.checklist_id
    LEFT JOIN "Task" t ON cat.id = t.category_id
WHERE
    o.name ILIKE '%xlent%'
    AND o.name ILIKE '%luleå%'
GROUP BY
    o.name, cl.id, cat.id, cat.name, cat.order
ORDER BY
    cat.order ASC;
*/

-- För att kontrollera vilka organisationer som finns:
/*
SELECT id, name, buddy_enabled, created_at
FROM "Organization"
WHERE name ILIKE '%xlent%' OR name ILIKE '%luleå%';
*/