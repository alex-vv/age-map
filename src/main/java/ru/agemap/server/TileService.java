package ru.agemap.server;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class TileService {
    @Inject
    AgroalDataSource dataSource;

    public byte[] generateTile(int z, int x, int y) {
        String sql = """
                    SELECT ST_AsMVT(tile, 'omsk', 4096, 'geom') as mvt
                    FROM (
                        SELECT
                            id,
                            r_year_int,
                            r_floors,
                            r_name,
                            r_adress,
                            ST_AsMVTGeom(
                                ST_Transform(geom, 3857),
                                ST_TileEnvelope(?, ?, ?),
                                4096,
                                64,
                                true
                            ) AS geom
                        FROM omsk
                        WHERE geom && ST_Transform(ST_TileEnvelope(?, ?, ?), 4326)
                    ) AS tile;
                """;

        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, z);
            stmt.setInt(2, x);
            stmt.setInt(3, y);
            stmt.setInt(4, z);
            stmt.setInt(5, x);
            stmt.setInt(6, y);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBytes("mvt");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error generating tile", e);
        }

        return new byte[0];
    }

}
