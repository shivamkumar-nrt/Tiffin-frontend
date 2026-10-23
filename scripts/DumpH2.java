import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.*;

/**
 * Dumps the legacy Spring Boot H2 database to JSON so it can be imported into Postgres
 * with `npm run db:import-h2`.
 *
 * Usage (needs the H2 jar, any 2.x; the old backend used 2.2.x):
 *   java -cp h2.jar scripts/DumpH2.java <path-to-db-without-.mv.db> <out.json>
 *   e.g. java -cp h2-2.2.224.jar scripts/DumpH2.java ../backend/data/tiffindb h2-dump.json
 *
 * Stop the old backend first (or work on a copy of the .mv.db file) so the file is not locked.
 */
public class DumpH2 {
    static final String[] TABLES = {
        "users", "price_configs", "combo_packages", "combo_items", "menus", "menu_items",
        "tiffin_requests", "tiffin_records", "payments", "invoices", "invoice_items",
        "audit_logs", "broadcast_notifications"
    };

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: DumpH2 <db-path-without-extension> <out.json>");
            System.exit(2);
        }
        String url = "jdbc:h2:file:" + Path.of(args[0]).toAbsolutePath().toString().replace('\\', '/')
                + ";IFEXISTS=TRUE;ACCESS_MODE_DATA=r";
        StringBuilder out = new StringBuilder("{\n");
        try (Connection c = DriverManager.getConnection(url, "sa", "")) {
            boolean firstTable = true;
            for (String t : TABLES) {
                if (!tableExists(c, t)) continue;
                if (!firstTable) out.append(",\n");
                firstTable = false;
                out.append("  ").append(str(t)).append(": [");
                try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT * FROM " + t)) {
                    ResultSetMetaData md = rs.getMetaData();
                    boolean firstRow = true;
                    int count = 0;
                    while (rs.next()) {
                        out.append(firstRow ? "\n" : ",\n").append("    {");
                        firstRow = false;
                        for (int i = 1; i <= md.getColumnCount(); i++) {
                            if (i > 1) out.append(", ");
                            out.append(str(md.getColumnLabel(i).toLowerCase())).append(": ").append(val(rs.getObject(i)));
                        }
                        out.append("}");
                        count++;
                    }
                    out.append(firstRow ? "]" : "\n  ]");
                    System.err.println(t + ": " + count + " rows");
                }
            }
        }
        out.append("\n}\n");
        Files.writeString(Path.of(args[1]), out.toString(), StandardCharsets.UTF_8);
        System.err.println("written " + args[1]);
    }

    static boolean tableExists(Connection c, String t) throws SQLException {
        try (ResultSet rs = c.getMetaData().getTables(null, null, t.toUpperCase(), new String[]{"TABLE"})) {
            return rs.next();
        }
    }

    static String val(Object o) {
        if (o == null) return "null";
        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Short) return o.toString();
        if (o instanceof BigDecimal) return ((BigDecimal) o).toPlainString();
        if (o instanceof Number) return o.toString();
        return str(o.toString());
    }

    static String str(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case '\t': b.append("\\t"); break;
                default:
                    if (ch < 0x20) b.append(String.format("\\u%04x", (int) ch)); else b.append(ch);
            }
        }
        return b.append('"').toString();
    }
}
