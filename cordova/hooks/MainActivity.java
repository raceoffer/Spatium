package capital.spatium.wallet;

import android.os.Bundle;
import org.apache.cordova.*;
import com.crashlytics.android.Crashlytics;
import io.fabric.sdk.android.Fabric;

public class MainActivity extends CordovaActivity
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        // enable Cordova apps to be started in the background
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }

        // Initialize Crashlytics
        Fabric.with(this, new Crashlytics());

        // Set by <content src="index.html" /> in config.xml
        loadUrl(launchUrl);
    }
}
