package ru.agemap.server;

import java.sql.SQLException;

import io.agroal.api.AgroalDataSource;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;

@Path("/tiles")
public class TilesResource {
    @Inject
    TileService tileService;

    @GET
    @Path("/{z}/{x}/{y}.pbf")
    @Produces("application/x-protobuf")
    public Response getTile(
            @PathParam("z") int z,
            @PathParam("x") int x,
            @PathParam("y") int y) throws SQLException {

        if (z < 0 || x < 0 || y < 0 || z > 20) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        byte[] mvtData = tileService.generateTile(z, x, y);

        if (mvtData.length == 0) {
            return Response.noContent().build();
        }

        return Response.ok(mvtData)
                .header("Cache-Control", "public, max-age=3600")
                .build();
    }
}
