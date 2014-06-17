
class GeoPoint : public node::ObjectWrap {
public:
    static v8::Persistent<v8::FunctionTemplate> constructor;
    static void Init(v8::Handle<v8::Object> target);

protected:
    GeoPoint(double lat, double lon);

    static v8::Handle<v8::Value> New(const v8::Arguments& args);
    static v8::Handle<v8::Value> Lat(const v8::Arguments& args);
    static v8::Handle<v8::Value> Lon(const v8::Arguments& args);

    // Your own object variables here
    //int value_;
    double lat_;
    double lon_;
};
